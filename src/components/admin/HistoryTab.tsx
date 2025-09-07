import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateSafely } from '@/lib/utils';
import { Order, RefundRecord } from '@/models/Order';

interface HistoryTabProps {
  order: Order;
}

export default function HistoryTab({ order }: HistoryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
        <CardDescription>
          Timeline of order events and changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {order.refunds && order.refunds.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-medium">Refund History</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Refund ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Processed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.refunds.map((refund:RefundRecord) => (
                  <TableRow key={refund.id}>
                    <TableCell>{formatDateSafely(refund.createdAt, 'PPpp')}</TableCell>
                    <TableCell className="font-mono">{refund.id}</TableCell>
                    <TableCell>${refund.amount.toFixed(2)}</TableCell>
                    <TableCell>{refund.reason}</TableCell>
                    <TableCell>{refund.processedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground">No refund history available.</p>
        )}
      </CardContent>
    </Card>
  );
}