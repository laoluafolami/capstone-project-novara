# terraform/modules/vpc/main.tf

# ── VPC ──────────────────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true  # Required for Kops and EKS
  enable_dns_support   = true  # Required for internal DNS resolution

  tags = {
    Name = "taskapp-vpc"
    # Kops requires this tag to discover the VPC
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# ── INTERNET GATEWAY ─────────────────────────────────────────────────────────
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "taskapp-igw"
  }
}

# ── PUBLIC SUBNETS ───────────────────────────────────────────────────────────
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "taskapp-public-${var.availability_zones[count.index]}"
    # Kops tag: tells Kops this subnet can host load balancers
    "kubernetes.io/role/elb"                            = "1"
    "kubernetes.io/cluster/${var.cluster_name}"         = "shared"
  }
}

# ── PRIVATE SUBNETS ──────────────────────────────────────────────────────────
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = false  # CRITICAL: no public IPs on worker nodes

  tags = {
    Name = "taskapp-private-${var.availability_zones[count.index]}"
    # Kops tag: tells Kops this subnet hosts internal load balancers
    "kubernetes.io/role/internal-elb"                 = "1"
    "kubernetes.io/cluster/${var.cluster_name}"       = "shared"
  }
}

# ── ELASTIC IPs FOR NAT GATEWAYS ─────────────────────────────────────────────
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name = "taskapp-nat-eip-${var.availability_zones[count.index]}"
  }

  depends_on = [aws_internet_gateway.main]
}

# ── NAT GATEWAYS ─────────────────────────────────────────────────────────────
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id  # NAT lives in PUBLIC subnet

  tags = {
    Name = "taskapp-nat-${var.availability_zones[count.index]}"
  }

  depends_on = [aws_internet_gateway.main]
}

# ── PUBLIC ROUTE TABLE ───────────────────────────────────────────────────────
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

resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ── PRIVATE ROUTE TABLES ─────────────────────────────────────────────────────
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

resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
