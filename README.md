# NexusGadgets - E-commerce Platform

## Description

NexusGadgets is a modern e-commerce platform built with Next.js and TypeScript. It provides a seamless and user-friendly experience for browsing and purchasing electronic gadgets.

## Key Features & Benefits

- **Modern UI:** Built with Next.js for a fast and responsive user interface.
- **TypeScript:** Ensures code maintainability and scalability.
- **Admin Panel:**  Offers administrative capabilities (protected by authentication using NextAuth) to manage products and other aspects of the platform.
- **Cloudinary Integration:** Utilizes Cloudinary for efficient image management, including uploading, deleting, and optimization.
- **Authentication:** Implements authentication using NextAuth.js for secure user management.
- **Radix UI:** Employs Radix UI components for accessible and customizable UI elements.
- **Form Handling:** Uses react-hook-form along with resolvers for robust form validation and management.

## Prerequisites & Dependencies

Before you begin, ensure you have the following installed:

- **Node.js:** (version 18 or higher recommended) - [https://nodejs.org/](https://nodejs.org/)
- **npm** or **yarn** or **pnpm** or **bun:** (Package Manager) - comes with Node.js installation
- **A Code Editor:** (e.g., VS Code, Sublime Text, etc.)
- **MongoDB:** A database instance for user authentication and persistence.

## Installation & Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd NexusGadgets
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Configure Environment Variables:**

   Create a `.env.local` file in the root directory and add the following environment variables:

   ```
   NEXTAUTH_SECRET=<your_secret_key>
   NEXTAUTH_URL=http://localhost:3000 # or your deployed URL
   MONGODB_URI=<your_mongodb_connection_string>
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
   CLOUDINARY_API_KEY=<your_cloudinary_api_key>
   CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your_cloudinary_upload_preset>
   ```

   *   Replace `<your_secret_key>` with a strong, randomly generated string.
   *   Replace `<your_mongodb_connection_string>` with your MongoDB connection string.
   *   Replace `<your_cloudinary_*>` with your Cloudinary credentials.

4. **Run the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Access the application:**

   Open your browser and navigate to `http://localhost:3000`.

## Usage Examples & API Documentation

### Running the application
After installation, the command  `npm run dev` will start the application.

### API Endpoints

*   **/api/admin/delete-image:** (POST) - Deletes an image from Cloudinary using the provided `publicId`. Requires Cloudinary credentials in the environment variables.
```typescript
// Example API usage (delete-image)

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { publicId } = await req.json();

  if (!publicId) {
    return NextResponse.json({ error: 'Missing public ID' }, { status: 400 });
  }

  // ... Cloudinary deletion logic
}
```
## Configuration Options

- **`.env.local`**:  The primary configuration file for environment variables. Refer to the Installation section for details.
- **`next.config.js`**: Contains Next.js specific configuration, such as image optimization settings.

## Project Structure

```
├── .gitignore              # Specifies intentionally untracked files that Git should ignore
├── README.md               # Project documentation
├── components.json         # Configuration for UI components
├── eslint.config.mjs       # ESLint configuration for code linting
├── middleware.ts           # Middleware for handling requests (e.g., authentication)
├── next.config.ts          # Next.js configuration file
├── package-lock.json       # Records the exact versions of dependencies
├── package.json            # Lists project dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration for CSS processing
└── public/                 # Static assets (images, fonts, etc.)
    ├── AirPodsMax.png
    ├── Iphone.png
    ├── MacBookPro14.png
    ├── NG.jpg
    ├── PlayStation.png
    ├── VisionPro.png
    ├── file.svg
    ├── globe.svg
    ├── next.svg
    └── vercel.svg
└── src/
    └──app/
       └── api/
           └── admin/
               └── delete-image/route.ts # Example API Route

```

## Contributing Guidelines

Contributions are welcome!  Here's how you can contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with descriptive messages.
4.  Push your changes to your forked repository.
5.  Submit a pull request.

Please ensure your code follows the established coding style and includes appropriate tests.

## License Information

This project is open source and available under the [MIT License](LICENSE.txt).

## Acknowledgments

*   This project utilizes [Next.js](https://nextjs.org/) framework.
*   UI Components are from [Radix UI](https://www.radix-ui.com/).
*   Image management is handled by [Cloudinary](https://cloudinary.com/).
*   Authentication is provided via [NextAuth.js](https://next-auth.js.org/).
*   Form Validation and Management is handled by [react-hook-form](https://www.react-hook-form.com/)
