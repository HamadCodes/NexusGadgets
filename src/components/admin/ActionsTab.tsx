import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, FileText } from 'lucide-react';

export default function ActionsTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Send pre-defined emails to the customer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Order Confirmation
          </Button>
          <Button variant="outline" className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Shipping Notification
          </Button>
          <Button variant="outline" className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Delivery Confirmation
          </Button>
          <Button variant="outline" className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Refund Confirmation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Generation</CardTitle>
          <CardDescription>
            Generate documents for this order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Invoice
          </Button>
          <Button variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Packing Slip
          </Button>
          <Button variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Return Label
          </Button>
          <Button variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Shipping Manifest
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}