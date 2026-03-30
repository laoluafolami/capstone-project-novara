# Subdomain Setup Guide - taskapp.benbolpharmacy.com

## Overview

You want to use `taskapp.benbolpharmacy.com` as your application domain. Since you own the root domain `benbolpharmacy.com`, this is **100% supported** and actually simpler than the original guide.

---

## Key Difference: Subdomain vs Root Domain

### Original Guide (Root Domain)
- You own: `yourdomain.com`
- You create hosted zone for: `yourdomain.com`
- You delegate NS records for: `yourdomain.com`
- Your app runs at: `taskapp.yourdomain.com`

### Your Setup (Subdomain)
- You own: `benbolpharmacy.com`
- You create hosted zone for: `benbolpharmacy.com`
- You delegate NS records for: `benbolpharmacy.com`
- Your app runs at: `taskapp.benbolpharmacy.com`

**The process is identical!** You just use your actual domain name.

---

## Step-by-Step Instructions

### STEP 1: Set Your Domain Variables

OPEN your terminal and RUN:

```bash
# Set your domain name
export DOMAIN_NAME="benbolpharmacy.com"
export SUBDOMAIN="taskapp"
export FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN_NAME}"

echo "Root Domain: $DOMAIN_NAME"
echo "Subdomain: $SUBDOMAIN"
echo "Full Domain: $FULL_DOMAIN"

# Save to bashrc for later use
echo "export DOMAIN_NAME=$DOMAIN_NAME" >> ~/.bashrc
echo "export SUBDOMAIN=$SUBDOMAIN" >> ~/.bashrc
echo "export FULL_DOMAIN=$FULL_DOMAIN" >> ~/.bashrc
```

### STEP 2: Create Route53 Hosted Zone

FOLLOW Section 3.2 of the AWS deployment guide, but use your domain:

```bash
# Create hosted zone for benbolpharmacy.com
aws route53 create-hosted-zone \
  --name "$DOMAIN_NAME" \
  --caller-reference "$(date +%s)" \
  --hosted-zone-config Comment="TaskApp capstone project" \
  --profile kops-admin

# Get the hosted zone ID
export HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='${DOMAIN_NAME}.'].Id" \
  --output text | cut -d'/' -f3)

echo "Hosted Zone ID: $HOSTED_ZONE_ID"
echo "export HOSTED_ZONE_ID=$HOSTED_ZONE_ID" >> ~/.bashrc
```

### STEP 3: Get Route53 Name Servers

FOLLOW Section 3.3 of the AWS deployment guide:

```bash
# Get the 4 name servers assigned by Route53
aws route53 get-hosted-zone \
  --id "$HOSTED_ZONE_ID" \
  --query 'DelegationSet.NameServers' \
  --output table
```

You will see 4 name servers. **COPY all 4.**

### STEP 4: Update Your Domain Registrar

FOLLOW Section 3.4 of the AWS deployment guide.

**Important:** You're updating the NS records for `benbolpharmacy.com` (your root domain), not a subdomain.

Where you registered `benbolpharmacy.com` (GoDaddy, Namecheap, Google Domains, etc.):
1. Go to your domain management panel
2. Find "Nameservers" or "DNS"
3. Change to "Custom Nameservers"
4. PASTE the 4 Route53 name servers
5. SAVE

### STEP 5: Verify DNS Delegation

FOLLOW Section 3.5 of the AWS deployment guide:

```bash
# Wait 10 minutes, then verify
dig NS $DOMAIN_NAME +short

# Should return the 4 Route53 name servers
```

### STEP 6: Continue with AWS Deployment

Now follow the rest of the AWS deployment guide (Sections 4-19) **exactly as written**, but replace:
- `yourdomain.com` → `benbolpharmacy.com`
- `taskapp.yourdomain.com` → `taskapp.benbolpharmacy.com`
- `api.yourdomain.com` → `api.benbolpharmacy.com` (if needed)

---

## Important Notes

### DNS Records You'll Create Later

After your Kubernetes cluster is running, you'll create these DNS records in Route53:

```bash
# Create A record for your application
aws route53 change-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "taskapp.benbolpharmacy.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "YOUR_LOAD_BALANCER_DNS",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

(The guide will provide the exact commands in Section 14)

### SSL/TLS Certificate

When you set up SSL/TLS (Section 14), use:
- Domain: `taskapp.benbolpharmacy.com`
- The certificate will be automatically created by Let's Encrypt

### Ingress Configuration

When you create the Kubernetes Ingress (Section 14), use:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: taskapp-ingress
  namespace: taskapp
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - taskapp.benbolpharmacy.com
    secretName: taskapp-tls
  rules:
  - host: taskapp.benbolpharmacy.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### Backend API (Optional)

If you want a separate domain for the backend API:
```bash
# Create another A record for the API
aws route53 change-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.benbolpharmacy.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "YOUR_LOAD_BALANCER_DNS",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

Then update your frontend to call `https://api.benbolpharmacy.com` instead of `https://taskapp.benbolpharmacy.com/api`.

---

## Comparison: Original Guide vs Your Setup

| Step | Original Guide | Your Setup |
|------|---|---|
| Domain | yourdomain.com | benbolpharmacy.com |
| Hosted Zone | yourdomain.com | benbolpharmacy.com |
| NS Delegation | yourdomain.com | benbolpharmacy.com |
| Application URL | taskapp.yourdomain.com | taskapp.benbolpharmacy.com |
| API URL | api.yourdomain.com | api.benbolpharmacy.com |
| Process | Same | Same |
| Difficulty | Same | Same |

---

## Quick Reference

### Variables to Use
```bash
export DOMAIN_NAME="benbolpharmacy.com"
export SUBDOMAIN="taskapp"
export FULL_DOMAIN="taskapp.benbolpharmacy.com"
export HOSTED_ZONE_ID="Z1234567890ABC"  # From Step 2
```

### Key Commands
```bash
# Create hosted zone
aws route53 create-hosted-zone --name benbolpharmacy.com ...

# Get name servers
aws route53 get-hosted-zone --id $HOSTED_ZONE_ID ...

# Verify DNS
dig NS benbolpharmacy.com +short

# Create A record (after cluster is running)
aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID ...
```

---

## Troubleshooting

### DNS Not Resolving
```bash
# Check if NS delegation is working
dig NS benbolpharmacy.com +short

# Should return Route53 name servers
# If not, wait 30 minutes and try again
```

### Certificate Issues
```bash
# Check certificate status
kubectl get certificate -n taskapp

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager
```

### Ingress Not Working
```bash
# Check ingress status
kubectl get ingress -n taskapp

# Check ingress logs
kubectl logs -n ingress-nginx deployment/nginx-ingress-controller
```

---

## Summary

✅ You can use `taskapp.benbolpharmacy.com`  
✅ The process is identical to the original guide  
✅ Just replace domain names in the guide  
✅ No additional complexity  
✅ Fully supported  

**Proceed with the AWS deployment guide, using `benbolpharmacy.com` as your domain.**

---

## Next Steps

1. **Set your domain variables** (Step 1 above)
2. **Follow Section 3 of the AWS deployment guide** (docs/guide/03-domain-dns.md)
3. **Use `benbolpharmacy.com` instead of `yourdomain.com`**
4. **Continue with Sections 4-19**

---

*Last Updated: March 27, 2026*
