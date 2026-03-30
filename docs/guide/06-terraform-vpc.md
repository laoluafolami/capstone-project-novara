# SECTION 6 — Terraform: VPC & Networking Module

> VPC = Virtual Private Cloud. It is your own isolated network inside AWS.
> Think of it as renting a private floor in a massive office building (AWS).
> You control who gets in, what rooms exist, and how traffic flows.
>
> CIDR = Classless Inter-Domain Routing. It defines the IP address range of your network.
> 10.0.0.0/16 means you have 65,536 IP addresses available (10.0.0.0 → 10.0.255.255).

---

## STEP 6.1 — Understand the Network Design

```
VPC: 10.0.0.0/16  (65,536 IPs — more than enough)

PUBLIC SUBNETS (have internet access via Internet Gateway):
  10.0.1.0/24  → us-east-1a  (256 IPs — for NAT Gateway, Load Balancer)
  10.0.2.0/24  → us-east-1b  (256 IPs — for NAT Gateway, Load Balancer)
  10.0.3.0/24  → us-east-1c  (256 IPs — for NAT Gateway, Load Balancer)

PRIVATE SUBNETS (NO direct internet — nodes live here):
  10.0.11.0/24 → us-east-1a  (256 IPs — Kubernetes masters + workers)
  10.0.12.0/24 → us-east-1b  (256 IPs — Kubernetes masters + workers)
  10.0.13.0/24 → us-east-1c  (256 IPs — Kubernetes masters + workers)

NAT GATEWAYS (one per AZ — no single point of failure):
  NAT-1 in public subnet us-east-1a → routes private subnet 1a outbound traffic
  NAT-2 in public subnet us-east-1b → routes private subnet 1b outbound traffic
  NAT-3 in public subnet us-east-1c → routes private subnet 1c outbound traffic
```

Why /24 for subnets? Each /24 gives 256 IPs. With 6 nodes per subnet max,
this is generous. The /16 VPC gives room to grow.

---

## STEP 6.2 — Create the VPC Module Variables File

OPEN VS Code. NAVIGATE to `terraform/modules/vpc/`.
CREATE `variables.tf`:

```hcl
# terraform/modules/vpc/variables.tf

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid CIDR block."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "cluster_name" {
  description = "Kubernetes cluster name (used for subnet tags Kops requires)"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
```

---

## STEP 6.3 — Create the VPC Module Main File

CREATE `terraform/modules/vpc/main.tf`:

```hcl
# terraform/modules/vpc/main.tf

# ── VPC ──────────────────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true   # Required for Kops and EKS
  enable_dns_support   = true   # Required for internal DNS resolution

  tags = {
    Name = "taskapp-vpc"
    # Kops requires this tag to discover the VPC
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# ── INTERNET GATEWAY ─────────────────────────────────────────────────────────
# The Internet Gateway allows resources in PUBLIC subnets to reach the internet
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "taskapp-igw"
  }
}

# ── PUBLIC SUBNETS ────────────────────────────────────────────────────────────
# Public subnets host NAT Gateways and the Load Balancer
# map_public_ip_on_launch = true means EC2s here get a public IP automatically
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "taskapp-public-${var.availability_zones[count.index]}"
    # Kops tag: tells Kops this subnet can host load balancers
    "kubernetes.io/role/elb"                              = "1"
    "kubernetes.io/cluster/${var.cluster_name}"           = "shared"
  }
}

# ── PRIVATE SUBNETS ───────────────────────────────────────────────────────────
# Private subnets host Kubernetes masters and workers
# NO public IPs — nodes are not directly reachable from the internet
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = false  # CRITICAL: no public IPs on worker nodes

  tags = {
    Name = "taskapp-private-${var.availability_zones[count.index]}"
    # Kops tag: tells Kops this subnet hosts internal load balancers
    "kubernetes.io/role/internal-elb"                     = "1"
    "kubernetes.io/cluster/${var.cluster_name}"           = "shared"
  }
}

# ── ELASTIC IPs FOR NAT GATEWAYS ──────────────────────────────────────────────
# Each NAT Gateway needs a static public IP address
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name = "taskapp-nat-eip-${var.availability_zones[count.index]}"
  }

  depends_on = [aws_internet_gateway.main]
}

# ── NAT GATEWAYS ──────────────────────────────────────────────────────────────
# NAT Gateways allow private subnet resources to reach the internet (outbound only)
# One per AZ = no single point of failure
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id  # NAT lives in PUBLIC subnet

  tags = {
    Name = "taskapp-nat-${var.availability_zones[count.index]}"
  }

  depends_on = [aws_internet_gateway.main]
}

# ── PUBLIC ROUTE TABLE ────────────────────────────────────────────────────────
# Routes all internet-bound traffic (0.0.0.0/0) through the Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "taskapp-public-rt"
  }
}

# Associate public route table with each public subnet
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ── PRIVATE ROUTE TABLES ──────────────────────────────────────────────────────
# One route table per AZ — each routes through its own NAT Gateway
# This ensures if one NAT fails, only one AZ loses outbound internet
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "taskapp-private-rt-${var.availability_zones[count.index]}"
  }
}

# Associate each private subnet with its own route table
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

---

## STEP 6.4 — Create the VPC Module Outputs File

CREATE `terraform/modules/vpc/outputs.tf`:

```hcl
# terraform/modules/vpc/outputs.tf

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}
```
