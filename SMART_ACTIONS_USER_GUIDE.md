# 🔗 Smart Actions Quick Guide
**How to Use the New Create PDCA & Create CAPA Report Buttons**

---

## 📍 Where to Find These Buttons

The **Create PDCA Cycle** and **Create CAPA Report** buttons appear in the **Checklist** section when you have **non-compliant** or **partially compliant** items.

### Navigation:
1. Go to any **Project**
2. Click on the **Checklist** tab
3. Expand any checklist item (click on it)
4. If the item is marked as **Non-Compliant** or **Partially Compliant**, you'll see the **Smart Actions** section at the bottom

---

## 🎯 Use Case 1: Create PDCA Cycle

### When to Use:
When you find a **non-compliant checklist item** that requires a **continuous improvement process** to fix.

### Example Scenario:
```
Checklist Item: "Hand hygiene compliance monitoring system"
Status: ⚠️ Non-Compliant
Standard: CBAHI 1.2.3
Findings: No formal monitoring system in place
```

### Step-by-Step:

1. **Expand the checklist item** (click on it to see details)

2. **Click "Create PDCA Cycle"** button in the Smart Actions section

3. **Auto-Created PDCA Cycle** will include:
   - ✅ **Title**: Automatically uses the standard ID and item name
     - Example: `CBAHI 1.2.3: Hand hygiene compliance monitoring system`
   
   - ✅ **Description**: Pre-filled with context
     ```
     Auto-created from non-compliant checklist item.
     
     Standard: CBAHI 1.2.3
     Issue: Hand hygiene compliance monitoring system
     
     Action Plan: Implement weekly audits and tracking system
     ```
   
   - ✅ **Category**: Set to "Process"
   - ✅ **Priority**: Set to "High"
   - ✅ **Current Stage**: Starts at "Plan"
   - ✅ **Owner**: Set to current user or assigned person
   - ✅ **Due Date**: Automatically set to 30 days from today

4. **Find Your PDCA Cycle**:
   - Go to **PDCA Cycles** tab in the same project
   - You'll see a new card in the **Plan** column
   - Click to open and customize further

5. **Continue the PDCA Process**:
   - **Plan**: Define improvement actions
   - **Do**: Implement changes
   - **Check**: Measure results
   - **Act**: Standardize or adjust

---

## 📋 Use Case 2: Create CAPA Report

### When to Use:
When you find a **non-compliant item** that requires **immediate corrective and preventive action**.

### Example Scenario:
```
Checklist Item: "Expired medications in emergency cart"
Status: 🔴 Non-Compliant
Standard: CBAHI 2.5.1
Findings: 3 expired medications found during inspection
```

### Step-by-Step:

1. **Expand the checklist item** (click on it)

2. **Click "Create CAPA Report"** button in the Smart Actions section

3. **Auto-Created CAPA Report** will include:
   - ✅ **Description**: 
     ```
     CBAHI 2.5.1: Expired medications in emergency cart
     ```
   
   - ✅ **Root Cause**: Set to "To be analyzed" (you fill this in later)
   
   - ✅ **Corrective Action**: Uses the action plan from checklist or "To be defined"
   
   - ✅ **Preventive Action**: Set to "To be defined"
   
   - ✅ **Status**: Set to "Open"
   
   - ✅ **Assigned To**: Current user or the person assigned to the checklist item
   
   - ✅ **Due Date**: 30 days from today
   
   - ✅ **PDCA Stage**: Starts at "Plan"
   
   - ✅ **Linked to Checklist Item**: Maintains connection for traceability

4. **Find Your CAPA Report**:
   - Go to **PDCA Cycles** tab (CAPA reports appear here too)
   - Look for the new card with **CAPA** badge
   - Click to view details

5. **Complete the CAPA**:
   - Click **"🤖 AI Root Cause Analysis"** to get AI suggestions
   - Fill in root cause, corrective action, preventive action
   - Advance through PDCA stages as you implement
   - Convert to full PDCA Cycle if needed (click "Convert to PDCA Cycle")

---

## 🤖 Bonus: AI-Powered Action Plans

### NEW Feature: Ask AI for Action Plan

Before creating PDCA or CAPA, you can get AI help!

1. **Click "🤖 Ask AI for Action Plan"** button
2. **AI analyzes** the checklist item and generates:
   - Specific steps to achieve compliance
   - Timeline suggestions
   - Resource requirements
   - Best practices from standards

3. **Review the AI-generated plan**:
   - Opens in edit mode
   - Action plan field is pre-filled
   - Review and modify as needed
   - Click "Save"

4. **Then create PDCA or CAPA**:
   - Now your action plan is already detailed
   - Creates better quality improvement records

---

## 💡 Smart Workflow Examples

### Workflow 1: Survey Finding → CAPA → PDCA
```
1. Survey finds non-compliance
   ↓
2. Mark checklist item as "Non-Compliant"
   ↓
3. Click "🤖 Ask AI for Action Plan"
   ↓
4. Review & save AI suggestions
   ↓
5. Click "Create CAPA Report"
   ↓
6. Fill in root cause (use "🤖 AI Root Cause Analysis")
   ↓
7. Implement corrective actions
   ↓
8. If ongoing improvement needed → "Convert to PDCA Cycle"
   ↓
9. Continue through full PDCA process
```

### Workflow 2: Audit Finding → Direct PDCA
```
1. Internal audit finds gap
   ↓
2. Mark checklist item as "Partially Compliant"
   ↓
3. Click "🤖 Ask AI for Action Plan"
   ↓
4. Click "Create PDCA Cycle"
   ↓
5. Go to PDCA Cycles tab
   ↓
6. Click "🤖 AI Improvement Suggestions"
   ↓
7. Work through Plan-Do-Check-Act stages
   ↓
8. Monitor metrics and complete cycle
```

---

## 📊 What Gets Auto-Filled

| Field | PDCA Cycle | CAPA Report |
|-------|-----------|-------------|
| **Title/Description** | ✅ Standard ID + Item | ✅ Standard ID + Item |
| **Standard Reference** | ✅ From checklist | ✅ From checklist |
| **Action Plan** | ✅ If filled in checklist | ✅ If filled in checklist |
| **Owner/Assigned To** | ✅ Current user or assignee | ✅ Current user or assignee |
| **Due Date** | ✅ 30 days from today | ✅ 30 days from today |
| **Priority** | ✅ High (auto) | N/A |
| **Category** | ✅ Process (auto) | N/A |
| **PDCA Stage** | ✅ Plan | ✅ Plan |
| **Status** | N/A | ✅ Open |
| **Root Cause** | N/A | ⚠️ "To be analyzed" |
| **Preventive Action** | N/A | ⚠️ "To be defined" |

**Legend:**
- ✅ = Auto-filled with smart data
- ⚠️ = Placeholder (you must fill in)
- N/A = Not applicable to this type

---

## ⚠️ Important Notes

### When Buttons DON'T Appear:
- ✅ **Compliant** items → No buttons (no action needed)
- ✅ **Not Applicable** items → No buttons (not relevant)
- ❌ Only **Non-Compliant** or **Partially Compliant** show buttons

### Best Practices:
1. ✅ **Use AI suggestions first** before creating PDCA/CAPA for better quality
2. ✅ **Add notes/findings** to checklist item before creating - provides better context
3. ✅ **Review auto-filled data** - you can edit everything after creation
4. ✅ **Link evidence** to checklist items for better traceability
5. ✅ **Use CAPA** for immediate fixes, **PDCA** for ongoing improvement

### Tips:
- 💡 You can create **both** CAPA and PDCA from the same checklist item
- 💡 CAPA reports can later be **converted to PDCA Cycles** if continuous improvement is needed
- 💡 All created items maintain a **link** to the original checklist item for audit trail
- 💡 Use the **🤖 AI buttons** throughout the process for expert guidance

---

## 🎯 Quick Reference

### Button Locations Summary:

| Button | Where | When Visible | What It Does |
|--------|-------|-------------|--------------|
| **🤖 Ask AI for Action Plan** | Checklist Item (expanded) | Non-Compliant or Partially Compliant | Generates action plan using AI |
| **Create PDCA Cycle** | Checklist Item (expanded) | Non-Compliant or Partially Compliant | Creates improvement cycle |
| **Create CAPA Report** | Checklist Item (expanded) | Non-Compliant or Partially Compliant | Creates corrective action report |
| **🤖 AI Root Cause Analysis** | PDCA Cycles tab (on CAPA cards) | Always visible on CAPA cards | Analyzes root cause with AI |
| **🤖 AI Improvement Suggestions** | PDCA Cycles tab (on PDCA cards) | Always visible on PDCA cycle cards | Suggests improvements with AI |
| **Convert to PDCA Cycle** | PDCA Cycles tab (on CAPA cards) | Always visible on CAPA cards | Converts CAPA to full PDCA cycle |

---

## 🚀 Video Tutorial Steps

### For Training Your Team:

**Step 1**: Navigate to Project → Checklist Tab
**Step 2**: Find or create a non-compliant item
**Step 3**: Click to expand the item details
**Step 4**: Scroll to bottom → See "Smart Actions" section
**Step 5**: Choose your action:
   - Need AI help? → Click "🤖 Ask AI for Action Plan" first
   - Quick corrective action? → Click "Create CAPA Report"
   - Ongoing improvement? → Click "Create PDCA Cycle"
**Step 6**: Review auto-filled data in PDCA Cycles tab
**Step 7**: Complete the process with AI assistance throughout

---

## ❓ FAQ

**Q: Can I create both PDCA and CAPA from the same item?**
A: Yes! You can create both. Use CAPA for immediate correction and PDCA for long-term improvement.

**Q: What if I don't see the buttons?**
A: Make sure the checklist item is marked as "Non-Compliant" or "Partially Compliant". Compliant items don't need action.

**Q: Can I edit the auto-filled information?**
A: Absolutely! Go to PDCA Cycles tab, click on the created item, and edit any field.

**Q: Where do I see the items I created?**
A: All PDCA Cycles and CAPA Reports appear in the "PDCA Cycles" tab of your project.

**Q: Can I delete if I created by mistake?**
A: Yes, but not from the checklist. Go to PDCA Cycles tab and delete from there.

**Q: Does this work on mobile?**
A: Yes! All buttons are responsive and work on tablets and phones.

---

## 📞 Need Help?

If you're stuck:
1. Check the checklist item status (must be Non-Compliant or Partially Compliant)
2. Make sure you're logged in with proper permissions
3. Try refreshing the page
4. Contact your AccreditEx administrator

---

**💡 Pro Tip**: Use the AI buttons liberally - they provide expert guidance based on healthcare accreditation best practices and save you hours of research!
