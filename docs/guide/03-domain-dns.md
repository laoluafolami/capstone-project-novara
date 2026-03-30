# SECTION 3 — Domain Setup & Route53 DNS Delegation

> DNS = Domain Name System. It translates human-readable names like
> "taskapp.yourdomain.com" into IP addresses that computers understand.
> Route53 is AWS's DNS service. You will tell your domain registrar
> (GoDaddy, Namecheap, Google Domains, etc.) to hand over DNS control
> to AWS Route53. This is called "NS delegation."

---

## STEP 3.1 — Buy or Locate Your Domain

You must own a real domain. Examples: taskapp.dev, myname-capstone.com, etc.

> ❌ You CANNOT use nip.io, xip.io, or any free wildcard DNS service.
> ❌ You CANNOT use a subdomain of someone else's domain.
> ✅ You MUST own the root domain (e.g., yourdomain.com).

If you do not have a domain yet:
- NAVIGATE to https://www.namecheap.com or https://domains.google.com
- SEARCH for a domain (e.g., yourname-taskapp.com — usually $10–$15/year)
- PURCHASE it

For the rest of this guide, replace `yourdomain.com` with your actual domain.

---

## STEP 3.2 — Create a Route53 Public Hosted Zone

A Hosted Zone is a container in Route53 that holds all DNS records for your domain.

```bash
# Replace yourdomain.com with your actual domain
export DOMAIN_NAME="yourdomain.com"

# Create the hosted zone
aws route53 create-hosted-zone \
  --name "$DOMAIN_NAME" \
  --caller-reference "$(date +%s)" \
  --hosted-zone-config Comment="TaskApp capstone project" \
  --profile kops-admin

# The output will include a HostedZoneId like: /hostedzone/Z1234567890ABC
# Save the zone ID (the part after /hostedzone/)
export HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='${DOMAIN_NAME}.'].Id" \
  --output text | cut -d'/' -f3)

echo "Hosted Zone ID: $HOSTED_ZONE_ID"
echo "export HOSTED_ZONE_ID=$HOSTED_ZONE_ID" >> ~/.bashrc
```

---

## STEP 3.3 — Get the Route53 Name Servers

Route53 assigned 4 name servers to your hosted zone. You need to copy these.

```bash
# Get the NS records Route53 assigned to your zone
aws route53 get-hosted-zone \
  --id "$HOSTED_ZONE_ID" \
  --query 'DelegationSet.NameServers' \
  --output table
```

You will see 4 name servers like:
```
ns-123.awsdns-45.com
ns-678.awsdns-90.net
ns-111.awsdns-22.org
ns-999.awsdns-55.co.uk
```

COPY all 4 of these. You will paste them into your domain registrar in the next step.

---

## STEP 3.4 — Update NS Records at Your Domain Registrar

This step tells the internet "Route53 is now in charge of DNS for yourdomain.com."

### If your registrar is Namecheap:
1. OPEN https://www.namecheap.com → Sign In
2. CLICK "Domain List" → CLICK "Manage" next to your domain
3. SCROLL to "Nameservers"
4. CHANGE the dropdown from "Namecheap BasicDNS" to "Custom DNS"
5. PASTE each of the 4 Route53 name servers into the fields
6. CLICK the green checkmark to save

### If your registrar is GoDaddy:
1. OPEN https://www.godaddy.com → Sign In → My Products
2. CLICK "DNS" next to your domain
3. SCROLL to "Nameservers" → CLICK "Change"
4. SELECT "Enter my own nameservers (advanced)"
5. PASTE each of the 4 Route53 name servers
6. CLICK "Save"

### If your registrar is Google Domains:
1. OPEN https://domains.google.com → Sign In
2. CLICK your domain → "DNS"
3. SCROLL to "Name servers" → CLICK "Switch to custom name servers"
4. PASTE each of the 4 Route53 name servers
5. CLICK "Save"

> ⏱️ DNS propagation takes 5 minutes to 48 hours. Usually it is under 30 minutes.
> You can check propagation at https://dnschecker.org

---

## STEP 3.5 — Verify DNS Delegation is Working

WAIT at least 10 minutes after updating your registrar, then RUN:

```bash
# Check that your domain resolves to Route53 name servers
dig NS $DOMAIN_NAME +short

# You should see the 4 Route53 NS records returned
# If you see your registrar's old NS records, wait longer and try again
```

Expected output (your actual NS values will differ):
```
ns-123.awsdns-45.com.
ns-678.awsdns-90.net.
ns-111.awsdns-22.org.
ns-999.awsdns-55.co.uk.
```

> ✅ Once dig returns the Route53 name servers, DNS delegation is complete.
> Do NOT proceed to the next section until this works.

---

## STEP 3.6 — Plan Your DNS Subdomains

You will create these DNS records later (after the cluster is running):

| Subdomain | Points To | Purpose |
|-----------|-----------|---------|
| `taskapp.yourdomain.com` | Kubernetes Ingress Load Balancer | React frontend |
| `api.yourdomain.com` | Kubernetes Ingress Load Balancer | Flask backend API |
| `*.yourdomain.com` (optional) | Ingress LB | Wildcard catch-all |

These A records will be created automatically by the AWS Load Balancer Controller
or manually after you deploy the ingress. We will handle this in Section 17.
