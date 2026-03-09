terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = "ap-south-1" # Mumbai region for India operations
}

# ── VPC & Network ──────────────────────────────────────────────────────────
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  name   = "fg-vpc"
  cidr   = "10.0.0.0/16"
  azs             = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  enable_nat_gateway = true
}

# ── EKS Cluster (Kubernetes) ───────────────────────────────────────────────
module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "fg-prod-cluster"
  cluster_version = "1.29"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10
      instance_types = ["t3.large"]
    }
  }
}

# ── RDS PostgreSQL (with PostGIS) ──────────────────────────────────────────
module "db" {
  source  = "terraform-aws-modules/rds/aws"
  identifier = "fg-postgres-prod"
  engine               = "postgres"
  engine_version       = "15"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.t4g.large"
  allocated_storage    = 100
  db_name              = "fg_db"
  username             = "fg_admin"
  port                 = 5432
  vpc_security_group_ids = [aws_security_group.db.id]
  subnet_ids             = module.vpc.private_subnets
  create_db_subnet_group = true
  multi_az               = true # High availability
}

# ── ElastiCache Redis ──────────────────────────────────────────────────────
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "fg-redis-prod"
  engine               = "redis"
  node_type            = "cache.t4g.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis.id]
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "fg-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

# ── MSK (Managed Kafka) ────────────────────────────────────────────────────
resource "aws_msk_cluster" "kafka" {
  cluster_name           = "fg-kafka-prod"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type   = "kafka.t3.small"
    client_subnets  = module.vpc.private_subnets
    security_groups = [aws_security_group.kafka.id]
  }
}

# ── Security Groups (Outputs omitted for brevity) ──────────────────────────
resource "aws_security_group" "db" { vpc_id = module.vpc.vpc_id }
resource "aws_security_group" "redis" { vpc_id = module.vpc.vpc_id }
resource "aws_security_group" "kafka" { vpc_id = module.vpc.vpc_id }
