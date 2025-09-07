// app/faq/page.tsx
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function FAQPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="border-b border-gray-200 py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Quick answers to common questions about orders, returns, warranties, and support.
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* FAQ 1 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                How long does shipping take?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                Most orders ship within 1 business day. Delivery times:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Continental US: 2-4 business days</li>
                  <li>Canada: 5-8 business days</li>
                  <li>International: 7-14 business days</li>
                </ul>
                Expedited shipping options available at checkout.
              </div>
            </CardContent>
          </Card>
          
          {/* FAQ 2 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                What is your return policy?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                We offer a 30-day hassle-free return policy:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Items must be unused and in original packaging</li>
                  <li>Free return shipping for defective items</li>
                  <li>Refunds processed within 3 business days</li>
                  <li>Return label included with all orders</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* FAQ 3 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Do you offer technical support?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                Yes! We provide comprehensive technical support:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Phone: (800) 555-5678 (Mon-Fri 9am-6pm PST)</li>
                  <li>Email: support@nexusgadgets.com</li>
                  <li>Live Chat: Available on our website</li>
                  <li>Setup guides and video tutorials for all products</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* FAQ 4 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                How do I track my order?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                Tracking options:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Tracking number emailed when order ships</li>
                  <li>Track through our website: Account → Order History</li>
                  <li>Use the carrier&apos;s website with your tracking number</li>
                  <li>SMS notifications available for most shipments</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* FAQ 5 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                What payment methods do you accept?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                We accept all major payment options:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Credit/Debit Cards (Visa, Mastercard, Amex)</li>
                  <li>PayPal</li>
                  <li>Apple Pay</li>
                  <li>Google Pay</li>
                  <li>Shop Pay</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* FAQ 6 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Do products come with warranty?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                All products include manufacturer warranty:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Standard warranty: 1 year for electronics</li>
                  <li>Extended warranty options available at checkout</li>
                  <li>Accidental damage coverage available</li>
                  <li>Warranty claims processed within 48 hours</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* FAQ 7 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Do you offer international shipping?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                Yes, we ship worldwide to over 150 countries:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Customs duties calculated at checkout</li>
                  <li>DHL Express for international shipments</li>
                  <li>Tracking included for all international orders</li>
                  <li>Regional compliance certifications included</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* FAQ 8 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                How do I cancel or change my order?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                Order modifications:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Cancellations: Within 1 hour of placement</li>
                  <li>Shipping address changes: Before order ships</li>
                  <li>Contact us immediately for modifications</li>
                  <li>Post-shipping changes: Contact carrier directly</li>
                </ul>
                Use our <Link href="/contact-us" className="text-blue-600 underline">contact form</Link> for fastest service.
              </div>
            </CardContent>
          </Card>
          
          {/* FAQ 9 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                What is your price match policy?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                We offer 30-day price matching:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Must be identical product from authorized retailer</li>
                  <li>Price difference refunded as store credit</li>
                  <li>Excludes limited-time promotions and flash sales</li>
                  <li>Submit claim within 30 days of purchase</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* FAQ 10 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Do you offer business/educational discounts?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                Special pricing programs:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Education discounts: 10% off for students/teachers</li>
                  <li>Business volume discounts: 5-15% based on quantity</li>
                  <li>Government/nonprofit pricing available</li>
                  <li>Contact our <Link href="/contact-us" className="text-blue-600 underline">business sales team</Link> for custom quotes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-16">
          <h3 className="text-xl font-semibold mb-6">Still have questions?</h3>
          <Button asChild className="py-6 px-8 text-lg">
            <Link href="/contact-us">
              Contact Our Support Team
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}