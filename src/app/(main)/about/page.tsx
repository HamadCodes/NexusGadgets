import { Smartphone, Laptop, Headphones, Watch, Camera, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  // Timeline data
  const timelineItems = [
    {
      year: "2010",
      title: "Founded in San Francisco",
      description: "Started as a small storefront with just 5 products and a vision to simplify technology.",
      position: "right"
    },
    {
      year: "2014",
      title: "Online Expansion",
      description: "Launched our e-commerce platform to serve customers nationwide.",
      position: "left"
    },
    {
      year: "2018",
      title: "Product Line Expansion",
      description: "Expanded our catalog to include all major electronics categories with over 500 products.",
      position: "right"
    },
    {
      year: "2023",
      title: "Global Community",
      description: "Serving customers in over 20 countries with a team of 100+ technology experts.",
      position: "left"
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="border-b border-gray-200 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Nexus Gadgets</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
              Where innovation meets reliability in the world of electronics
            </p>
            <div className="mt-10">
              <Link href="/">
                <Button className="px-8 py-6 text-lg">
                  Explore Our Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold mb-8">Our Mission</h2>
              <p className="text-lg mb-6">
                At Nexus Gadgets, we believe technology should empower, not overwhelm. Since 2010, we have curated the 
                most innovative electronics to help you stay connected, productive, and entertained.
              </p>
              <p className="text-lg mb-6">
                Our mission is simple: provide cutting-edge technology with straightforward guidance, making premium 
                electronics accessible to everyone.
              </p>
              <p className="text-lg">
                We meticulously test every product to ensure it meets our standards for quality, performance, and value.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Card className="w-full h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">2010</div>
                  <div className="text-lg">Founded in San Francisco</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Product Categories */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Product Philosophy</h2>
            <p className="text-lg max-w-2xl mx-auto">
              We specialize in premium electronics across six core categories, each selected for innovation and reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Smartphone className="h-8 w-8 mr-4" />
                  <CardTitle>Smartphones</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-6">
                  Flagship devices with exceptional cameras, performance, and battery life from leading manufacturers.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/categories/phones" className="font-bold hover:underline">
                  Explore Phones →
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Laptop className="h-8 w-8 mr-4" />
                  <CardTitle>Laptops</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-6">
                  Productivity, gaming, and creative workstations with powerful processors and stunning displays.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/categories/laptops" className="font-bold hover:underline">
                  Explore Laptops →
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Headphones className="h-8 w-8 mr-4" />
                  <CardTitle>Headphones</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-6">
                  Premium audio experiences with noise cancellation, true wireless, and studio-quality sound.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/categories/headphones" className="font-bold hover:underline">
                  Explore Headphones →
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Watch className="h-8 w-8 mr-4" />
                  <CardTitle>Smart Watches</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-6">
                  Health monitoring, fitness tracking, and notifications in elegant, wearable designs.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/categories/smartwatches" className="font-bold hover:underline">
                  Explore Watches →
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Camera className="h-8 w-8 mr-4" />
                  <CardTitle>Cameras</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-6">
                  DSLR, mirrorless, and compact cameras for professionals and enthusiasts alike.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/categories/cameras" className="font-bold hover:underline">
                  Explore Cameras →
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Gamepad2 className="h-8 w-8 mr-4" />
                  <CardTitle>Gaming Consoles</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-6">
                  Next-generation gaming systems with immersive experiences and exclusive titles.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/categories/consoles" className="font-bold hover:underline">
                  Explore Consoles →
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Every product undergoes rigorous testing to ensure it meets our performance and durability standards.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expert Guidance</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Our team provides honest, knowledgeable advice to help you find the perfect tech solution.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sustainable Tech</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  We prioritize products with eco-friendly designs and responsible manufacturing practices.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Timeline*/}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-16 text-center">Our Journey</h2>
          
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 md:left-1/2 md:-translate-x-1/2 z-0"></div>
            
            {/* Timeline Items */}
            {timelineItems.map((item, index) => (
              <div key={index} className="relative mb-12 last:mb-0">
                <div className="flex items-center">
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center z-10 md:left-1/2 md:-translate-x-1/2">
                    <span className="font-bold text-[12px]">{item.year}</span>
                  </div>
                  
                  <div className={`pl-16 w-full md:pl-0 ${
                    item.position === "left" 
                      ? "md:pr-[50%] md:mr-8" 
                      : "md:ml-[50%] md:pl-8"
                  }`}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 border-t border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-6">Join the Nexus Community</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Subscribe for exclusive product launches, tech insights, and special offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="py-4"
            />
            <Button className="py-4">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}