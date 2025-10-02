# Ishaan Koradia - Personal Website

A modern, interactive personal portfolio website featuring an AI-powered chatbot that helps visitors learn about Ishaan Koradia, an aspiring AI/ML Engineer and UCSD student.

## 🌟 Features

- **Responsive Design**: Mobile and desktop optimized with smooth animations
- **Interactive Elements**: Particle background effects and typing animations
- **AI Chatbot**: Learn about Ishaan through an intelligent chatbot powered by MCP (Model Context Protocol)
- **Portfolio Showcase**: Featured projects including Transformi, Daily Motivation, and NotesTaker
- **Contact Integration**: Direct links to GitHub, LinkedIn, and email

## 🛠️ Tech Stack

### Frontend
- **HTML5/CSS3**: Modern responsive design
- **JavaScript**: Interactive elements and animations
- **jQuery**: DOM manipulation and AJAX calls
- **Typed.js**: Typing animation effects
- **Particles.js**: Background particle effects

### Backend (MCP Server)
- **FastAPI**: High-performance Python web framework
- **Model Context Protocol (MCP)**: AI/LLM integration
- **FastMCP**: MCP server implementation
- **Render**: Cloud deployment platform

## 🤖 AI Chatbot

The website features an intelligent chatbot that uses the Model Context Protocol (MCP) to provide personalized responses about Ishaan. The chatbot can answer questions about:

- Educational background (UCSD, Cognitive/Data Science)
- Technical skills (Python, JavaScript, ML)
- Projects (Transformi, Daily Motivation, NotesTaker and Github repos) 
- Interests and career goals
- Contact information via Linkedin

### How it works:
1. User sends a message through the chatbot
2. Frontend sends request to FastAPI backend
3. MCP server processes the query using the knowledge base
4. AI-generated response is returned to the user

## 🌐 Deployment

### MCP Server (Render)
The MCP server is deployed on Render using the included `render.yaml` configuration:

### Frontend (GitHub Pages)
The frontend is deployed using GitHub Pages with custom domain configuration.

### Styling
- `style.css`: Main website styles
- `chatbot-widget.css`: Chatbot-specific styles

## 📱 Responsive Design

The website is fully responsive with:
- Mobile-first design approach
- Touch-friendly chatbot interface
- Optimized loading for mobile networks
- Adaptive layouts for tablets and desktops
