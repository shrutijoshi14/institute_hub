# Institute ERP App

A unified Enterprise Resource Planning (ERP) web application for institutes, supporting 9 user roles (Super Admin, Branch Admin, Faculty, Accountant, Receptionist, Librarian, Transport Manager, Parent, and Student), complete with dynamic board/syllabus trackers, homework/result portals, fees management, and academic resources.

## 🚀 One-Click Deploy to Render

Deploy the entire stack (both React frontend and Node.js backend) together automatically in one click by clicking the button below:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/shrutijoshi14/institute_hub)

---

## 🛠️ One-Command Deployment

Once your application is deployed on Render via the blueprint setup, **Render is linked directly to your GitHub repository**. 

Any time you make a change, the only command you need to run to deploy **both the frontend and backend together** is:

```bash
git push
```

Render will automatically notice the push to your `main` branch, build the code, and perform a zero-downtime deployment for both services simultaneously.

---

## 📁 Repository Structure

- `/frontend` - React.js and Vite client application
- `/backend` - Node.js Express & Sequelize ORM server application
- `/database` - SQL database schemas and setups
- `render.yaml` - Render Blueprint infrastructure configuration
- `DEPLOYMENT.md` - Complete production-level deployment guide
