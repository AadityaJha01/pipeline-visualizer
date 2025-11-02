# Ansible Playbooks

This directory contains Ansible playbooks for automating server setup and configuration.

## Prerequisites

- Ansible >= 2.9
- SSH access to target servers
- Python 3 on target servers

## Setup

1. **Configure Inventory**

   ```bash
   cp inventory.example inventory
   # Edit inventory with your server details
   ```

2. **Run Playbook**

   ```bash
   ansible-playbook -i inventory playbook.yml
   ```

## What It Does

The playbook automatically:
- Updates system packages
- Installs Docker and Docker Compose
- Installs and configures Jenkins
- Installs Node.js and npm
- Installs Terraform
- Configures firewall rules
- Sets up application directory

## Variables

You can customize the playbook by setting variables:
- `jenkins_admin_user` - Jenkins admin username (default: admin)
- `jenkins_admin_pass` - Jenkins admin password (required)
- `docker_compose_version` - Docker Compose version

## Example Usage

```bash
ansible-playbook -i inventory playbook.yml \
  -e "jenkins_admin_user=admin" \
  -e "jenkins_admin_pass=secure123"
```

