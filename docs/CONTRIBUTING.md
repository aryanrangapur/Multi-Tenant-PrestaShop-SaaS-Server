# Contributing to PrestaShop Multi-Tenant SaaS Platform

Thank you for your interest in contributing.  
This project aims to build a scalable multi-tenant PrestaShop SaaS platform using Flask, Next.js, and Docker.  
We welcome contributions in code, documentation, testing, and bug reports.



## How to Contribute

### 1. Fork and Clone
```bash
# Fork this repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/Multi-Tenant-PrestaShop-SaaS-Server.git
cd Multi-Tenant-PrestaShop-SaaS-Server
```

### 2. Create a New Branch
Use a descriptive branch name:
```bash
git checkout -b fix/docker-network-issue
# or
git checkout -b feature/add-admin-auth
```

### 3. Set Up the Project

#### Backend (Flask)
```bash
cd backend
python -m venv venv
source venv/bin/activate    # On Linux/Mac
venv\Scripts\activate       # On Windows
pip install -r requirements.txt
python app.py
```

#### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

#### Or Use Docker Compose
```bash
docker-compose up -d
```

Access the app:
- Frontend → http://localhost:3000  
- Backend API → http://localhost:5000  
- Store → http://localhost:8081 (auto-assigned)



## Running Tests
Please ensure all tests pass before submitting a pull request.

If you add new features, also add relevant tests.  
Testing framework recommendations:
- Backend: `pytest`
- Frontend: `jest` or `react-testing-library`



## Code Style Guidelines

### Python (Flask)
- Follow PEP 8 style guide.
- Use meaningful variable and function names.
- Include docstrings for functions and modules.

### JavaScript / TypeScript (Next.js)
- Follow Prettier and ESLint rules.
- Keep components modular and reusable.
- Avoid inline styles; use Tailwind classes.

### Commit Messages
Follow the conventional commit style:
```
feat: add tenant network isolation
fix: resolve port allocation race condition
docs: update AWS deployment guide
```



## Reporting Bugs
If you find a bug, please open a GitHub issue with:
1. A clear description of the problem
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment details (OS, Docker version, etc.)

Before submitting, check if a similar issue already exists.



## Suggesting New Features
Open an issue with:
- A clear use case
- How it fits into the architecture
- Potential implementation outline (optional)



## Security Issues
Do not post security vulnerabilities publicly.  
Instead, email the maintainer directly at **aryan.rangapur717@gmail.com** (or your preferred contact).



## Documentation Contributions
If you improve setup steps, architecture diagrams, or README sections:
- Update files inside the `docs/` folder.
- Use clear markdown structure and code blocks.



## Pull Request Process
1. Ensure your branch is up to date with `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Test locally before pushing.
3. Open a pull request with a clear title and description.
4. Reference any related issue using `Fixes #<issue-number>` if applicable.
5. Wait for review; maintainers will provide feedback.



## Community Guidelines
- Be respectful and constructive.
- Avoid spam or irrelevant comments.
- Follow the [Code of Conduct](../CODE_OF_CONDUCT.md) if present.



## License
By contributing, you agree that your contributions will be licensed under the same license as the project, the MIT License.



Thank you for helping make this platform better.
