# Pipeline Visualizer 2.0 🚀

A modern, interactive web-based visualization tool that dynamically displays Jenkins pipeline stages, build history, and deployment status in real-time.

![Pipeline Visualizer](https://img.shields.io/badge/version-2.0-blue)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![AWS](https://img.shields.io/badge/AWS-Terraform-orange)

## ✨ Features

- 📊 **Real-time Pipeline Visualization** - Animated D3.js pipeline graphs
- 🔄 **Live Build Status** - Monitor Jenkins builds as they happen
- 📈 **Build History** - Track deployment trends over time
- 🎨 **Modern UI** - Clean, responsive design with smooth animations
- 🔌 **Jenkins Integration** - Direct REST API connectivity
- ☁️ **Cloud-Ready** - Terraform + Ansible for AWS deployment

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React UI  │ ───► │  Express API │ ───► │   Jenkins   │
│  (D3.js)    │      │   (Node.js)  │      │  REST API   │
└─────────────┘      └──────────────┘      └─────────────┘
      │                      │
      │                      │
      ▼                      ▼
┌─────────────────────────────────────┐
│      AWS (EC2 + S3 + ECR + EKS)     │
│         (Managed by Terraform)      │
└─────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Jenkins instance (or access to Jenkins REST API)
- AWS Account (for cloud deployment)
- Terraform 1.0+

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repo-url>
   cd pipeline-visualizer
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your Jenkins credentials
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Docker Deployment

```bash
docker-compose up -d
```

### AWS Deployment (Terraform)

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Ansible Setup

```bash
cd ansible
ansible-playbook -i inventory playbook.yml
```

## 📁 Project Structure

```
pipeline-visualizer/
├── frontend/          # React + D3.js UI
├── backend/           # Express API server
├── terraform/         # AWS infrastructure
├── ansible/           # Server automation
├── docker/            # Container configs
└── jenkins/           # Jenkins pipeline files
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
JENKINS_URL=http://your-jenkins-url
JENKINS_USER=your-username
JENKINS_TOKEN=your-api-token
PORT=5000
NODE_ENV=development
```

## 📚 Documentation

- [Frontend Setup](./frontend/README.md)
- [Backend API Docs](./backend/README.md)
- [Terraform Guide](./terraform/README.md)
- [Ansible Playbooks](./ansible/README.md)

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📄 License

MIT License - feel free to use this project for your portfolio!

---

**Built with ❤️ for DevOps Engineers**

