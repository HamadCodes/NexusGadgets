# Nexus Gadgets 🛍️

A modern, full-stack e-commerce platform built with Next.js 15, featuring a comprehensive product catalog, secure payment processing, and advanced admin management capabilities.

## �� Features

### 🛒 E-commerce Core
- **Product Catalog**: Browse products across 6 categories (phones, laptops, smartwatches, cameras, headphones, consoles)
- **Advanced Filtering**: Dynamic filters by brand, color, specifications, and price range
- **Product Search**: Real-time search with intelligent suggestions
- **Shopping Cart**: Persistent cart with local storage sync
- **Favorites System**: Save and manage favorite products
- **Product Reviews**: User-generated reviews with rating system

### �� Payment & Checkout
- **Stripe Integration**: Secure payment processing with multiple payment methods
- **Tax Calculation**: Automatic tax calculation based on location
- **Shipping Calculator**: Dynamic shipping costs by country and method
- **VAT Validation**: EU VAT number validation for business customers
- **Order Management**: Complete order lifecycle tracking

### 👤 User Management
- **Authentication**: Google OAuth and email/password login
- **User Profiles**: Customizable profiles with image upload
- **Order History**: Complete order tracking and management

### 🔧 Admin Panel
- **Product Management**: Create, edit, and delete products with rich specifications
- **Order Management**: Process orders, update status, and handle refunds
- **Inventory Tracking**: Real-time stock management
- **Image Management**: Cloudinary integration for product images

### 🎨 UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern Components**: Radix UI components with custom styling
- **Loading States**: Skeleton loaders and smooth transitions
- **Toast Notifications**: Real-time feedback system

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management with validation
- **Zustand** - State management
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **NextAuth.js** - Authentication framework
- **Stripe** - Payment processing
- **Cloudinary** - Image management

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Zod** - Schema validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Stripe account
- Cloudinary account
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexusgadgets
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/nexusgadgets
   
   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Stripe
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure


nexusgadgets/
├── src/
│ ├── app/ # Next.js App Router
│ │ ├── (main)/ # Main application routes
│ │ │ ├── about/ # About page
│ │ │ ├── admin/ # Admin panel
│ │ │ ├── auth/ # Authentication pages
│ │ │ ├── cart/ # Shopping cart
│ │ │ ├── categories/ # Category pages
│ │ │ ├── checkout/ # Checkout process
│ │ │ ├── favorites/ # User favorites
│ │ │ ├── orders/ # Order management
│ │ │ ├── products/ # Product pages
│ │ │ ├── profile/ # User profile
│ │ │ └── search/ # Search functionality
│ │ ├── api/ # API routes
│ │ │ ├── admin/ # Admin API endpoints
│ │ │ ├── auth/ # Authentication API
│ │ │ ├── orders/ # Order management API
│ │ │ ├── products/ # Product API
│ │ │ ├── user/ # User management API
│ │ │ └── webhook/ # Stripe webhooks
│ │ ├── globals.css # Global styles
│ │ ├── layout.tsx # Root layout
│ │ └── page.tsx # Home page
│ ├── components/ # React components
│ │ ├── admin/ # Admin-specific components
│ │ ├── ui/ # Reusable UI components
│ │ └── ... # Feature components
│ ├── hooks/ # Custom React hooks
│ ├── lib/ # Utility libraries
│ ├── models/ # TypeScript type definitions
│ ├── stores/ # State management
│ └── types/ # Type definitions
├── public/ # Static assets
├── components.json # shadcn/ui configuration
├── next.config.ts # Next.js configuration
├── tailwind.config.js # Tailwind CSS configuration
└── package.json # Dependencies and scripts


## �� Configuration

### Stripe Setup
1. Create a Stripe account and get your API keys
2. Set up webhook endpoints for payment processing
3. Configure webhook events: `payment_intent.succeeded`

### Cloudinary Setup
1. Create a Cloudinary account
2. Get your cloud name, API key, and secret

### Google OAuth Setup
1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## �� API Endpoints

### Products
- `GET /api/products` - Get all products with filters
- `GET /api/products/search` - Search products
- `GET /api/products/filters` - Get filter options
- `POST /api/products/batch` - Get products by IDs

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/[id]/cancel` - Cancel order

### User Management
- `GET /api/user/cart` - Get user cart
- `POST /api/user/cart` - Add to cart
- `PUT /api/user/cart` - Update cart
- `DELETE /api/user/cart` - Remove from cart
- `GET /api/user/favorites` - Get user favorites
- `POST /api/user/favorites` - Add to favorites
- `DELETE /api/user/favorites` - Remove from favorites

### Admin
- `GET /api/admin/products` - Get all products (admin)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product
- `GET /api/admin/orders` - Get all orders (admin)
- `PATCH /api/admin/orders/[id]` - Update order status

## �� Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@nexusgadgets.com or create an issue in the repository.

## �� Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Stripe](https://stripe.com/) for payment processing
- [Cloudinary](https://cloudinary.com/) for image management

---

**Nexus Gadgets** - Connecting you with cutting-edge technology! 🚀
