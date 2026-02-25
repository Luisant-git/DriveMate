# Quick Access Guide - Lead Management in Admin Panel

## 🎯 Where to Find Lead Features

### Admin Panel Navigation
After logging in as Admin, you'll see these tabs in the dashboard:

```
BOOKINGS | APPROVALS | DRIVERS | CUSTOMERS | LEADS | LEAD PACKAGES | LEAD SUBSCRIPTIONS | PACKAGES | SUBSCRIPTIONS | PRICING | SERVICE AREAS | PAYMENTS | REPORTS
```

---

## 📍 1. LEADS Tab
**Location:** Admin Dashboard → LEADS

**What you can do:**
- ✅ View all registered lead drivers
- ✅ See lead details (name, email, phone, documents)
- ✅ Filter by status: ALL | PENDING | APPROVED | REJECTED
- ✅ Approve pending leads
- ✅ Reject leads
- ✅ View package type (LOCAL/OUTSTATION/ALL)

**Status Colors:**
- 🟢 Green = APPROVED
- 🟡 Yellow = PENDING
- 🔴 Red = REJECTED

---

## 📍 2. LEAD PACKAGES Tab
**Location:** Admin Dashboard → LEAD PACKAGES

**What you can do:**
- ✅ View all subscription packages for leads
- ✅ Create new packages (click "Add Package" button)
- ✅ Edit existing packages
- ✅ Set package details:
  - Name
  - Type (LOCAL/OUTSTATION/ALL)
  - Price
  - Duration (in days)
  - Description
- ✅ See Active/Inactive status

**Package Types:**
- LOCAL - For local area rides
- OUTSTATION - For outstation trips
- ALL_PREMIUM - All services included

---

## 📍 3. LEAD SUBSCRIPTIONS Tab
**Location:** Admin Dashboard → LEAD SUBSCRIPTIONS

**What you can do:**
- ✅ View all lead subscriptions
- ✅ Filter by status: ALL | ACTIVE | EXPIRED | CANCELLED
- ✅ See subscription details:
  - Lead information
  - Plan details
  - Total amount
  - Paid amount
  - Remaining amount
  - Start and end dates
- ✅ Track payment status

**Status Colors:**
- 🟢 Green = ACTIVE
- 🔴 Red = EXPIRED
- ⚪ Gray = CANCELLED

---

## 🔄 Complete Workflow

### For New Lead Registration:
1. Lead registers via Lead Registration page
2. Admin sees new lead in **LEADS** tab with PENDING status
3. Admin reviews lead details
4. Admin clicks "Approve" or "Reject"
5. Lead can now login and access services

### For Lead Subscription Management:
1. Admin creates packages in **LEAD PACKAGES** tab
2. Admin can assign subscriptions to leads
3. View all subscriptions in **LEAD SUBSCRIPTIONS** tab
4. Track payments and subscription status

---

## 🎨 UI Features

### Mobile Responsive
- Card-based layout on mobile devices
- Easy-to-use buttons and filters
- Optimized for touch interactions

### Desktop View
- Table-based layout for better data visibility
- Multiple columns for detailed information
- Hover effects for better UX

### Consistent Design
- Matches existing admin panel styling
- Color-coded status badges
- Clean and modern interface

---

## 🔗 Related Pages

### Lead Portal (for Leads)
- Lead Registration: `/lead/register`
- Lead Login: `/lead/login`
- Lead Dashboard: After login

### API Endpoints
- Backend APIs are automatically integrated
- All CRUD operations supported
- Real-time data updates

---

## 📊 Data Displayed

### LEADS Tab Shows:
- Name, Email, Phone
- Aadhar Number, License Number
- Package Type
- Status
- Action buttons (Approve/Reject)

### LEAD PACKAGES Tab Shows:
- Package Name
- Type (LOCAL/OUTSTATION/ALL)
- Price
- Duration
- Description
- Active/Inactive status
- Edit button

### LEAD SUBSCRIPTIONS Tab Shows:
- Lead Name & Contact
- Plan Name & Type
- Total Amount
- Paid Amount
- Remaining Amount
- Subscription Period
- Status

---

## ✨ Key Features

1. **Real-time Updates** - Changes reflect immediately
2. **Filter Options** - Quick filtering by status
3. **Responsive Design** - Works on all devices
4. **Easy Management** - Simple approve/reject workflow
5. **Complete Tracking** - Full subscription lifecycle management

---

## 🚀 Getting Started

1. **Login as Admin**
   - Use admin credentials
   - Access admin dashboard

2. **Navigate to Lead Sections**
   - Click on LEADS, LEAD PACKAGES, or LEAD SUBSCRIPTIONS tabs
   - Use filters to find specific data

3. **Manage Leads**
   - Review pending leads
   - Approve or reject as needed
   - Create subscription packages
   - Track subscriptions

---

## 💡 Tips

- Use filters to quickly find specific leads or subscriptions
- Check PENDING leads regularly for new registrations
- Keep subscription packages updated with current pricing
- Monitor ACTIVE subscriptions for payment tracking
- Use the responsive design on tablets for on-the-go management

---

## 📞 Support

For any issues or questions:
- Check the LEAD_ADMIN_INTEGRATION.md for technical details
- Review API endpoints in backend documentation
- Contact development team for custom requirements
