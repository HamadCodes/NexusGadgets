import { getServerSession } from 'next-auth';
import { getProductBySlug } from '@/lib/products';
import { notFound } from 'next/navigation';
import ProductDetails from '@/components/ProductDetails';
import ProductSpecifications from '@/components/ProductSpecifications';
import ReviewSection from '@/components/ReviewSection';
import authOptions from '@/lib/auth';

// Update the props interface to accept params as a Promise
interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Await the params Promise
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const product = await getProductBySlug(slug);
  
  if (!product) return notFound();

  // Convert Mongoose document to plain object
  const plainProduct = JSON.parse(JSON.stringify(product));

  // Ensure session has user ID
  const sessionWithId = session ? {
    user: {
      id: session.user?.id || '',
    }
  } : null;

  return (
    <div className="container mx-auto mt-5 px-4 py-8">
      <ProductDetails product={plainProduct} />
      <div className="mt-16">
        <ProductSpecifications product={plainProduct} />
      </div>
      <div className="mt-16">
        <ReviewSection 
          productId={plainProduct._id} 
          session={sessionWithId}
        />
      </div>
    </div>
  );
}