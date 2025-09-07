// app/contact-us/page.tsx
import { Mail, Phone, MapPin, Clock} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="border-b border-gray-200 py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Nexus Gadgets</h1>
          <p className="text-xl max-w-2xl mx-auto">
            We are here to help with any questions about our products, orders, or technical support.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Send us a message</h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block mb-2 font-medium">Name</label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Your name" 
                    required 
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block mb-2 font-medium">Email</label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block mb-2 font-medium">Subject</label>
                <Input 
                  id="subject" 
                  type="text" 
                  placeholder="How can we help?" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block mb-2 font-medium">Message</label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us about your inquiry..." 
                  rows={5} 
                  required 
                />
              </div>
              
              <Button type="submit" className="w-full py-6 text-lg">
                Send Message
              </Button>
            </form>
          </div>
          
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Get in touch</h2>
            
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Our Headquarters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">123 Tech Boulevard</p>
                  <p className="mb-2">San Francisco, CA 94103</p>
                  <p>United States</p>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Phone className="h-5 w-5 mr-2" />
                      Phone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-1">Sales: (800) 555-1234</p>
                    <p>Support: (800) 555-5678</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="h-5 w-5 mr-2" />
                      Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-1">General: info@nexusgadgets.com</p>
                    <p>Support: support@nexusgadgets.com</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Monday-Friday</div>
                    <div className="col-span-2">9:00 AM - 6:00 PM PST</div>
                    
                    <div className="font-medium">Saturday</div>
                    <div className="col-span-2">10:00 AM - 4:00 PM PST</div>
                    
                    <div className="font-medium">Sunday</div>
                    <div className="col-span-2">Closed</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      
      {/* Map Section */}
    <div className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Visit Our Store</h2>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Replace placeholder with real Google Map */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.613170293881!2d-122.41941572436972!3d37.77665297185587!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808b8f006b03%3A0xdf5e50b1a60a0a99!2s123%20Tech%20Blvd%2C%20San%20Francisco%2C%20CA%2094103%2C%20USA!5e0!3m2!1sen!2sus!4v1690834303270!5m2!1sen!2sus"
              width="100%"
              height="384"
              className="border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Store Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monday-Friday</span>
                    <span>10am - 8pm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>10am - 6pm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>11am - 5pm</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Parking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">Free parking available in our underground garage.</p>
                <p>Enter on Tech Boulevard - first 2 hours free with validation.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>In-Store Services</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Product demonstrations</li>
                  <li>Technical support</li>
                  <li>Trade-in program</li>
                  <li>Workshops & training</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}