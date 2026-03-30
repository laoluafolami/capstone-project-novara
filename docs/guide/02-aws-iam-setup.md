# SECTION 2 — AWS Account Setup & IAM Configuration

> IAM = Identity and Access Management. It controls WHO can do WHAT in your AWS account.
> The rule: never use the root account. Always create a dedicated IAM user with only the
> permissions it needs. This is called "least privilege."

---

## STEP 2.1 — Log Into AWS Console (Root Account — One Time Only)

OPEN your browser. NAVIGATE to https://console.aws.amazon.com

SIGN IN with your root account (the email you used to create AWS).

> ⚠️ WARNING: After this step you will NEVER use root again for daily work.
> Root has unlimited power — one mistake can destroy everything.

---

## STEP 2.2 — Enable MFA on Root Account

MFA = Multi-Factor Authentication. It adds a second layer of security.

1. CLICK your account name (top right) → "Security credentials"
2. SCROLL to "Multi-factor authentication (MFA)"
3. CLICK "Assign MFA device"
4. CHOOSE "Authenticator app" (use Google Authenticator or Authy on your phone)
5. SCAN the QR code with your phone app
6. ENTER two consecutive 6-digit codes from the app
7. CLICK "Add MFA"

---

## STEP 2.3 — Create an IAM User for Kops (Cluster Creator)

This user will have the permissions Kops needs to create the cluster.

NAVIGATE to IAM → Users → "Create user"

```
Username: kops-admin
Access type: ✅ Programmatic access (CLI only)
```

ATTACH these managed policies directly:

```
AmazonEC2FullAccess
AmazonRoute53FullAccess
AmazonS3FullAccess
IAMFullAccess
AmazonVPCFullAccess
AmazonSQSFullAccess
AmazonEventBridgeFullAccess
```

> Why these? Kops needs to create EC2 instances (your nodes), Route53 DNS records,
> S3 buckets (for cluster state), IAM roles (for nodes), and VPC resources.

CLICK "Create user". On the next screen:

1. CLICK "Create access key"
2. CHOOSE "Command Line Interface (CLI)"
3. DOWNLOAD the CSV file — this contains your Access Key ID and Secret Access Key
4. STORE this file somewhere safe (NOT in your Git repo)

---

## STEP 2.4 — Configure AWS CLI with the Kops User Credentials

OPEN your terminal. RUN:

```bash
aws configure --profile kops-admin
```

You will be prompted for:

```
AWS Access Key ID [None]: PASTE_YOUR_ACCESS_KEY_ID_HERE
AWS Secret Access Key [None]: PASTE_YOUR_SECRET_ACCESS_KEY_HERE
Default region name [None]: us-east-1
Default output format [None]: json
```

> Why us-east-1? It has the most AWS services available and lowest latency for most users.
> You can use any region — just be consistent throughout this guide.

VERIFY the profile works:

```bash
aws sts get-caller-identity --profile kops-admin
```

Expected output:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/kops-admin"
}
```

SET this profile as your default for this session:

```bash
export AWS_PROFILE=kops-admin
export AWS_REGION=us-east-1

# Add these to your ~/.bashrc or ~/.zshrc so they persist
echo 'export AWS_PROFILE=kops-admin' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
```

---

## STEP 2.5 — Set AWS Budget Alert (Mandatory — Prevents Surprise Bills)

> This project can cost $5–$15/day if left running. Set a budget alert NOW.

NAVIGATE to AWS Console → Billing → Budgets → "Create budget"

```
Budget type: Cost budget
Budget name: capstone-taskapp-budget
Budgeted amount: $50
Alert threshold: 80% of budgeted amount ($40)
Email recipients: your-email@example.com
```

CLICK "Create budget".

> You will receive an email warning when you have spent $40, giving you time to
> clean up before hitting $50.

---

## STEP 2.6 — Note Your AWS Account ID

You will need your 12-digit AWS Account ID throughout this guide.

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Your AWS Account ID: $AWS_ACCOUNT_ID"

# Save it for later use
echo "export AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID" >> ~/.bashrc
```

---

## STEP 2.7 — Choose Your AWS Region and Availability Zones

```bash
# Set your region (us-east-1 recommended)
export AWS_REGION=us-east-1

# List available AZs in your region
aws ec2 describe-availability-zones \
  --region $AWS_REGION \
  --query 'AvailabilityZones[].ZoneName' \
  --output table

# You will use the first 3 AZs. For us-east-1 these are:
# us-east-1a, us-east-1b, us-east-1c
export AZ1=us-east-1a
export AZ2=us-east-1b
export AZ3=us-east-1c
```
