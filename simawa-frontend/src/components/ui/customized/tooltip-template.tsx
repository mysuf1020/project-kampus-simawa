import { Label } from '../label'

export const tooltipTemplate = {
  manualRegistrationStatus: (
    <div className="flex flex-row rounded-lg items-top w-full">
      <ol className="list-decimal list-inside space-y-1 wrap-anywhere">
        Status:
        <li className="strong">
          <Label>
            <strong>Confirmed</strong>: Data registration already confirmed and sent to
            KYC review.
          </Label>
        </li>
        <li className="strong">
          <Label>
            <strong>Not Confirmed</strong>: Data registration is not confirmed. Please
            change the status into confirmed once the entity approve the bank account.
          </Label>
        </li>
      </ol>
    </div>
  ),
  tableStatus: (
    <div className="flex flex-row rounded-lg items-top w-full">
      <ol className="list-decimal list-inside space-y-1 wrap-anywhere">
        Status:
        <li className="strong">
          <Label>
            <strong>Need Review</strong>: Awaiting initial review by Maker, or Maker, or
            returned to Maker for correction.
          </Label>
        </li>
        <li className="strong">
          <Label>
            <strong>Waiting Approval</strong>: Maker&apos;s review is complete; awaiting
            Checker&apos;s final approval.
          </Label>
        </li>
        <li className="strong">
          <Label>
            <strong>In Revision</strong>: Application sent back to merchant for required
            revisions.
          </Label>
        </li>
        <li className="strong">
          <Label>
            <strong>Declined</strong>: Application has been declined by either Checker or
            Maker.
          </Label>
        </li>
        <li className="strong">
          <Label>
            <strong>Approved</strong>: Application has been approved by Checker
          </Label>
        </li>
      </ol>
    </div>
  ),

  orderStatus: (
    <ol className="list-decimal list-inside marker:font-bold space-y-1">
      Order Status:
      <li>
        <Label>
          <strong>Pending</strong> – Order created and payment is in progress.
        </Label>
      </li>
      <li>
        <Label>
          <strong>Success</strong> – Payment processed successfully and order confirmed.
        </Label>
      </li>
      <li>
        <Label>
          <strong>Cancelled</strong> – Payment was cancelled by merchant.
        </Label>
      </li>
      <li>
        <Label>
          <strong>Failed</strong> – Order created but payment failed due to invalid
          merchant data or a technical issue.
        </Label>
      </li>
    </ol>
  ),

  paymentStatus: (
    <ol className="list-decimal list-inside marker:font-bold space-y-1">
      Payment Status:
      <li>
        <Label>
          <strong>Pending</strong> – Payment is in progress.
        </Label>
      </li>
      <li>
        <Label>
          <strong>Success</strong> – Payment processed successfully and order confirmed.
        </Label>
      </li>
      <li>
        <Label>
          <strong>Failed</strong> – Payment attempt failed due to invalid merchant,
          invalid QRIS, etc.
        </Label>
      </li>
      <li>
        <Label>
          <strong>Reconciled</strong> – Payment success and matches with switching data.
        </Label>
      </li>
      <li>
        <Label>
          <strong>Disputed</strong> – Payment success but mismatches with switching data.
        </Label>
      </li>
      <li>
        <Label>
          <strong>Settled</strong> – Funds have been transferred to the merchant’s
          account.
        </Label>
      </li>
    </ol>
  ),

  // tableStatus: (
  //   <p className="block wrap-break-word">
  //     ini adalah paragraph lorem ipsum domot amet
  //     asdfkjasldkjflsdkjflskdjflskdjfdlskj
  //   </p>
  // ),
  tableAction: (
    <div className="flex flex-row rounded-lg items-top wrap-anywhere">
      <ol className="list-disc list-inside space-y-1">
        Action:
        <li className="strong">
          <Label>
            <strong>Maker</strong>: Manages applications in &quot;Need Review&quot; and
            &quot;Declined&quot; status.
          </Label>
        </li>
        <li className="strong">
          <Label>
            <strong>Checker</strong>: Manages applications in &quot;Waiting Approval&quot;
            and &quot;Declined&quot; status.
          </Label>
        </li>
      </ol>
    </div>
  ),
  tableInfoMDR: (
    <div className="flex flex-col rounded-lg items-top wrap-anywhere gap-4">
      <ul className="list-disc list-inside space-y-1">
        <strong>ON-US MDR 0.7%</strong>
        <li className="strong">
          <Label>MDR spread (Bluepay) 0.7%</Label>
        </li>
      </ul>

      <ul className="list-disc list-inside space-y-1">
        <strong>OFF-US MDR 0.7%</strong>
        <li className="strong">
          <Label>MDR spread (Bluepay) 0.35%</Label>
        </li>
        <li className="strong">
          <Label>MDR spread (Principal) 0.35%</Label>
        </li>
      </ul>
    </div>
  ),
  batchSettlementStatus: (
    <ul className="list-disc list-inside marker:font-bold space-y-1">
      Batch Status:
      <li>
        <Label>
          <strong>Ready to Settle</strong> : Batch that ready to settle
        </Label>
      </li>
      <li>
        <Label>
          <strong>In Progress</strong> : One or more entities has settled status
        </Label>
      </li>
      <li>
        <Label>
          <strong>Completed</strong> : All entities has been settled (exclude removed
          entity)
        </Label>
      </li>
    </ul>
  ),
  batchSettlementDetailStatus: (
    <ul className="list-disc list-inside marker:font-bold space-y-1">
      Batch Status:
      <li>
        <Label>
          <strong>Ready to Settle</strong> : Entity that ready to settle
        </Label>
      </li>
      <li>
        <Label>
          <strong>Need Review</strong> : Entity settlement status updated and need to
          review by checker
        </Label>
      </li>
      <li>
        <Label>
          <strong>Settled</strong> : Approved entity settlement
        </Label>
      </li>
      <li>
        <Label>
          <strong>Rejected</strong> : Rejected entity settlement
        </Label>
      </li>
    </ul>
  ),
  tableInfoCredit: (
    <div className="flex flex-col rounded-lg items-top wrap-anywhere gap-4">
      <ul className="list-disc list-inside space-y-1">
        <Label>
          <strong>Credit:</strong> Adding amount to account
        </Label>
      </ul>
    </div>
  ),
  tableInfoDebit: (
    <div className="flex flex-col rounded-lg items-top wrap-anywhere gap-4">
      <ul className="list-disc list-inside space-y-1">
        <Label>
          <strong>Debit:</strong> Deducting amount from account
        </Label>
      </ul>
    </div>
  ),
}
