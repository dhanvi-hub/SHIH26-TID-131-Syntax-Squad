import type { jsPDF } from 'jspdf'
import type { ProcessedTransaction } from '@/lib/types'

/**
 * Renders a static, PDF-friendly vector snapshot of the Entity Relationship & Consortium Graph.
 * Uses jsPDF drawing primitives (rect, roundedRect, circle, line, triangle, text) to guarantee
 * high-resolution, un-pixelated, printable vector output without any random or fake nodes.
 */
export function renderPDFEntityGraph(
  doc: jsPDF,
  txn: ProcessedTransaction
): void {
  // Add a dedicated page for the graph section
  doc.addPage()
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)

  // 1. Page Background Card
  doc.setFillColor(243, 244, 246) // Light background
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  doc.setFillColor(255, 255, 255) // White container card
  doc.roundedRect(margin, margin, contentWidth, pageHeight - (margin * 2), 4, 4, 'F')

  let y = margin + 14

  // 2. Section Header
  doc.setTextColor(31, 41, 55) // Dark gray header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Entity Relationship & Consortium Graph', margin + 10, y)

  y += 5
  doc.setFontSize(8.5)
  doc.setTextColor(107, 114, 128)
  doc.setFont('helvetica', 'normal')
  doc.text('Privacy-Preserving Multi-Entity Topology & Consortium Threat Analysis', margin + 10, y)

  doc.setFontSize(7.5)
  doc.setTextColor(156, 163, 175)
  doc.text(`Transaction ID: ${txn.txn_id} | ${new Date(txn.timestamp).toLocaleString('en-IN')}`, pageWidth - margin - 10, y, { align: 'right' })

  y += 6
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.5)
  doc.line(margin + 10, y, pageWidth - margin - 10, y)

  // 3. Extract Real Entities from Investigation Payload
  const intel = txn.agentResults?.intelligence
  const hasConsortiumMatch = Boolean(intel?.matched && intel?.matches && intel.matches.length > 0)
  const topIntelMatch = hasConsortiumMatch ? intel!.matches[0] : null

  // Graph Layout Center Calculations
  const centerX = pageWidth / 2
  const centerY = y + 80

  // ── Node Definitions (Carefully dimensioned to fit inside margins) ──
  const txnNode = {
    x: centerX - 28,
    y: centerY - 13,
    w: 56,
    h: 26,
    label: 'ACTIVE TRANSACTION',
    val: `Rs. ${txn.amount.toLocaleString('en-IN')}`,
    sub: `${txn.status} (${txn.riskScore}/100)`,
  }

  const userNode = {
    x: centerX - 82,
    y: centerY - 52,
    w: 52,
    h: 25,
    label: 'ORIGINATOR ACCOUNT',
    val: txn.user_id,
    sub: 'User Profile',
  }

  const benNode = {
    x: centerX + 30,
    y: centerY - 52,
    w: 52,
    h: 25,
    label: 'DESTINATION ENTITY',
    val: txn.beneficiary_id || 'Direct Transfer',
    sub: hasConsortiumMatch ? 'Consortium Flagged' : 'Unflagged',
  }

  const deviceNode = {
    x: centerX - 82,
    y: centerY + 28,
    w: 52,
    h: 25,
    label: 'HARDWARE / DEVICE',
    val: (txn.device_fingerprint || txn.device).slice(0, 18),
    sub: txn.device,
  }

  const ipNode = {
    x: centerX - 26,
    y: centerY + 32,
    w: 52,
    h: 25,
    label: 'NETWORK IP / NODE',
    val: txn.ip,
    sub: txn.location.slice(0, 20),
  }

  const intelNode = hasConsortiumMatch && topIntelMatch ? {
    x: centerX + 30,
    y: centerY + 28,
    w: 54,
    h: 27,
    label: 'CONSORTIUM MATCH',
    val: topIntelMatch.signalType || 'THREAT_MATCH',
    sub: `${topIntelMatch.contributingInstitutions?.length || topIntelMatch.reportingInstitutionsCount || 1} Banks Flagged`,
  } : null

  // Helper: Draw Arrow Edge
  const drawEdge = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    label: string,
    color: number[] = [156, 163, 175]
  ) => {
    doc.setDrawColor(color[0], color[1], color[2])
    doc.setLineWidth(0.7)
    doc.line(x1, y1, x2, y2)

    // Calculate mid point for relationship text label
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2

    // Draw relationship text badge
    doc.setFillColor(255, 255, 255)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    const labelWidth = doc.getTextWidth(label) + 4
    doc.roundedRect(midX - (labelWidth / 2), midY - 3, labelWidth, 5.5, 1, 1, 'F')
    doc.setDrawColor(color[0], color[1], color[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(midX - (labelWidth / 2), midY - 3, labelWidth, 5.5, 1, 1, 'S')

    doc.setTextColor(color[0], color[1], color[2])
    doc.text(label, midX, midY + 0.8, { align: 'center' })

    // Draw Arrowhead at (x2, y2)
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const arrowLen = 3
    const ax1 = x2 - arrowLen * Math.cos(angle - Math.PI / 6)
    const ay1 = y2 - arrowLen * Math.sin(angle - Math.PI / 6)
    const ax2 = x2 - arrowLen * Math.cos(angle + Math.PI / 6)
    const ay2 = y2 - arrowLen * Math.sin(angle + Math.PI / 6)

    doc.setFillColor(color[0], color[1], color[2])
    doc.triangle(x2, y2, ax1, ay1, ax2, ay2, 'F')
  }

  // ── Render Directed Relationship Edges ──
  // 1. User -> Transaction
  drawEdge(
    userNode.x + userNode.w / 2,
    userNode.y + userNode.h,
    txnNode.x + 5,
    txnNode.y,
    'AUTHORIZES',
    [2, 132, 199]
  )

  // 2. Transaction -> Beneficiary
  drawEdge(
    txnNode.x + txnNode.w - 5,
    txnNode.y,
    benNode.x + benNode.w / 2,
    benNode.y + benNode.h,
    'ROUTES_TO',
    hasConsortiumMatch ? [220, 38, 38] : [6, 182, 212]
  )

  // 3. Transaction -> Device
  drawEdge(
    txnNode.x + 10,
    txnNode.y + txnNode.h,
    deviceNode.x + deviceNode.w / 2,
    deviceNode.y,
    'USED_DEVICE',
    [107, 114, 128]
  )

  // 4. Transaction -> IP Address
  drawEdge(
    txnNode.x + txnNode.w / 2,
    txnNode.y + txnNode.h,
    ipNode.x + ipNode.w / 2,
    ipNode.y,
    'USED_IP',
    [107, 114, 128]
  )

  // 5. Beneficiary -> Consortium Match (if present)
  if (intelNode) {
    drawEdge(
      benNode.x + benNode.w / 2,
      benNode.y + benNode.h,
      intelNode.x + intelNode.w / 2,
      intelNode.y,
      'CONSORTIUM_MATCH',
      [220, 38, 38]
    )
  }

  // ── Render Nodes Function with Header Banner ──
  const drawNode = (
    node: { x: number; y: number; w: number; h: number; label: string; val: string; sub: string },
    bgRGB: number[],
    borderRGB: number[],
    headerTextRGB: number[] = [255, 255, 255]
  ) => {
    // Drop shadow
    doc.setFillColor(230, 233, 238)
    doc.roundedRect(node.x + 0.6, node.y + 0.6, node.w, node.h, 2.5, 2.5, 'F')

    // Background
    doc.setFillColor(bgRGB[0], bgRGB[1], bgRGB[2])
    doc.roundedRect(node.x, node.y, node.w, node.h, 2.5, 2.5, 'F')

    // Border
    doc.setDrawColor(borderRGB[0], borderRGB[1], borderRGB[2])
    doc.setLineWidth(0.6)
    doc.roundedRect(node.x, node.y, node.w, node.h, 2.5, 2.5, 'S')

    // Header Banner
    doc.setFillColor(borderRGB[0], borderRGB[1], borderRGB[2])
    doc.roundedRect(node.x, node.y, node.w, 6, 2.5, 2.5, 'F')
    doc.rect(node.x, node.y + 3, node.w, 3, 'F') // Square bottom corners of banner

    // Header Label
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(headerTextRGB[0], headerTextRGB[1], headerTextRGB[2])
    doc.text(node.label, node.x + node.w / 2, node.y + 4.3, { align: 'center' })

    // Value Text
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(17, 24, 39)
    const splitVal = doc.splitTextToSize(node.val, node.w - 4)
    doc.text(splitVal[0], node.x + node.w / 2, node.y + 13, { align: 'center' })

    // Subtitle
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    const splitSub = doc.splitTextToSize(node.sub, node.w - 4)
    doc.text(splitSub[0], node.x + node.w / 2, node.y + 20, { align: 'center' })
  }

  // Draw User Node
  drawNode(userNode, [240, 249, 255], [2, 132, 199])

  // Draw Transaction Core Node (Dynamic by status)
  const statusBg = txn.status === 'FRAUD' ? [254, 242, 242] : txn.status === 'SUSPICIOUS' ? [254, 252, 232] : [240, 253, 244]
  const statusBorder = txn.status === 'FRAUD' ? [239, 68, 68] : txn.status === 'SUSPICIOUS' ? [245, 158, 11] : [34, 197, 94]
  drawNode(txnNode, statusBg, statusBorder)

  // Draw Beneficiary Node
  const benBg = hasConsortiumMatch ? [254, 242, 242] : [236, 254, 255]
  const benBorder = hasConsortiumMatch ? [239, 68, 68] : [6, 182, 212]
  drawNode(benNode, benBg, benBorder)

  // Draw Hardware Device Node
  drawNode(deviceNode, [249, 250, 251], [107, 114, 128])

  // Draw Network IP Node
  drawNode(ipNode, [249, 250, 251], [107, 114, 128])

  // Draw Consortium Intelligence Node
  if (intelNode) {
    drawNode(intelNode, [254, 242, 242], [220, 38, 38])
  }

  // ── Legend Section (Responsive Multi-Line Wrapping) ──
  const statusBorderColor = txn.status === 'FRAUD' ? [239, 68, 68] : txn.status === 'SUSPICIOUS' ? [245, 158, 11] : [34, 197, 94]
  const legendY = pageHeight - margin - 26
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.5)
  doc.line(margin + 10, legendY - 4, pageWidth - margin - 10, legendY - 4)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)
  doc.text('Graph Legend:', margin + 10, legendY + 2)

  const legendItems = [
    { label: 'Originator Account', color: [2, 132, 199] },
    { label: 'Transaction Core', color: statusBorderColor },
    { label: 'Beneficiary Entity', color: [6, 182, 212] },
    { label: 'Device / Network Node', color: [107, 114, 128] },
  ]
  if (hasConsortiumMatch) {
    legendItems.push({ label: 'Consortium Threat Match', color: [220, 38, 38] })
  }

  let lx = margin + 35
  let ly = legendY + 2
  const maxLx = pageWidth - margin - 15

  legendItems.forEach((item) => {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    const textWidth = doc.getTextWidth(item.label)
    const itemWidth = 4 + textWidth + 8

    // If item exceeds card boundary, wrap to next line
    if (lx + itemWidth > maxLx) {
      lx = margin + 35
      ly += 6.5
    }

    doc.setFillColor(item.color[0], item.color[1], item.color[2])
    doc.circle(lx, ly - 1.5, 2, 'F')

    doc.setTextColor(75, 85, 99)
    doc.text(item.label, lx + 4, ly)
    lx += itemWidth
  })

  // Footer text
  const footerY = pageHeight - margin - 6
  doc.setFontSize(7.5)
  doc.setTextColor(156, 163, 175)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin + 10, footerY)
  doc.text('AI-Powered Fraud Detection System - Entity Topology Report', pageWidth - margin - 10, footerY, { align: 'right' })
}
