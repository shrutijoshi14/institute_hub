# System Design Document

## System Overview

The system is designed as a lightweight educational website that allows users to access course information and submit enquiries or registrations.

The architecture will follow a simple static website structure with form integrations.

---

## System Components

The system will consist of:

Frontend Website
Form Handling System
Data Storage

---

## Frontend Layer

The frontend will be responsible for displaying content and forms.

Technologies used:

- HTML
- CSS
- JavaScript
- Bootstrap

---

## Form Handling

Forms will be implemented using Google Forms.

Forms include:

- Student registration
- Enquiry submission

---

## Data Storage

All form responses will be stored in:

Google Sheets

This allows easy access and management of data by the institute.

---

## Data Flow

User → Website Form → Google Forms → Google Sheets

---

## Security Considerations

- Spam protection using Google Forms
- Secure HTTPS hosting
- Basic form validation

---

## Scalability

Future upgrades may include:

- Backend server
- Database integration
- Admin dashboard
- Student login system
