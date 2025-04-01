# Recipe Master 🍽️

A powerful, full-stack web application that helps you organize and manage both cooking and cleaning recipes in one place. Built with modern technologies and best practices.

<div align="center">
  <a href="https://nextjs.org" target="_blank">
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  </a>
  <a href="https://react.dev" target="_blank">
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  </a>
  <a href="https://tailwindcss.com" target="_blank">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  </a>
  <a href="https://supabase.com" target="_blank">
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </a>
  <a href="https://openai.com" target="_blank">
    <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
  </a>
</div>

<br />

<div align="center">
  <div style="display: flex; justify-content: center; gap: 20px; margin: 40px 0;">
    <img src="public/recipemaster.webp" alt="Recipe Master Screenshot" width="79%" style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
    <img src="public/recipemaster.gif" alt="Recipe Master Demo GIF" width="20%" style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
  </div>
</div>

## 🚀 Features

### Authentication & User Management

- **Secure User Authentication**: Email-based authentication using Supabase Auth
- **User Profiles**: Personalized experience with user profiles and usernames
- **Password Reset**: Secure password recovery workflow with email verification

### Recipe Management

- **Dual Recipe Categories**: Manage both cooking recipes and cleaning recipes
- **CRUD Operations**: Create, read, update, and delete your recipes
- **Rich Formatting**: Store detailed instructions, ingredients, and photos
- **Real-time Updates**: Changes to recipes are reflected instantly using Supabase realtime subscriptions
- **Recipe Sharing**: Share your favorite recipes with friends via unique links

### AI-Powered Features

- **Nutritional Analysis**: Automatically calculate macronutrients (calories, protein, carbs, fats) from your ingredients using OpenAI API
- **Smart Recommendations**: Get personalized recipe suggestions based on your preferences

### Search & Organization

- **Advanced Sorting**: Sort recipes by name or creation date
- **Smart Filtering**: Filter recipes by various attributes

### Modern UI/UX

- **Responsive Design**: Fully responsive interface that works on mobile, tablet, and desktop
- **Dark/Light Mode**: Support for system theme preferences
- **Interactive UI Components**: Smooth transitions and intuitive controls built with shadcn/ui
- **Toast Notifications**: Informative feedback for user actions

## 💻 Tech Stack

### Frontend

- **Next.js 15** with App Router for server components and optimized rendering
- **React 19** for building interactive user interfaces
- **TypeScript** for type-safe code
- **TailwindCSS** for beautiful, responsive styling
- **shadcn/ui** for accessible, customizable UI components
- **Cloudinary** for image optimization and storage

### Backend

- **Next.js API Routes** for serverless functions
- **Supabase** for authentication, database, and real-time subscriptions
- **OpenAI API** for intelligent recipe analysis and suggestions

### Infrastructure

- **Vercel** for seamless deployment and hosting
- **Supabase PostgreSQL** for data storage

## 🌟 Unique Selling Points

- **All-in-One Solution**: No need for separate apps to manage cooking and cleaning recipes
- **AI Integration**: Nutritional analysis powered by OpenAI's latest models
- **Real-time Collaboration**: Changes to recipes are instantly reflected across devices
- **Modern Architecture**: Built with the latest web technologies for performance and maintainability
- **Mobile-Friendly**: Use on any device with a responsive design

## 📈 Future Plans

- Advanced AI-generated recipes based on available ingredients
- Shopping list generation from recipes
- Meal planning calendar
- Public recipe discovery and marketplace
- Enhanced analytics for nutrition tracking
- Mobile app using React Native

## 🔧 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/your-username/recipe-master.git

# Install dependencies
npm install

# Set up environment variables (see .env.example)

# Run the development server
npm run dev
```

## 📱 Usage

1. Register a new account or login
2. Create your first recipe by clicking the "+" button
3. Browse your recipes on the homepage
4. Edit or delete recipes as needed
5. Switch between cooking and cleaning recipe modes
6. Share your favorite recipes with friends

## 🔒 Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `OPENAI_API_KEY`: Your OpenAI API key for nutrition analysis

## 👨‍💻 About the Developer

This project was built by a passionate full-stack developer with a focus on creating intuitive, high-performance web applications that solve real problems. The codebase demonstrates expertise in modern React patterns, API integrations, authentication flows, and responsive design.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ using Next.js, React, TypeScript, and Supabase
