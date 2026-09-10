# Lifecycle Agent: Maturity Notification System

This document specifies the trigger intervals, channel delivery mechanisms, and copy templates used by the **Maturity & Reinvestment Lifecycle Agent**.

---

## 1. Notification Cadence & Trigger Intervals

The agent executes a scheduled batch job every morning at 09:30 AM BST:

| Trigger Window | Priority | Recommended Channel | Goal |
|---|---|---|---|
| **60 Days Out** | Low | Email | Early heads-up to review upcoming cash availability. |
| **30 Days Out** | Medium | WhatsApp / Email | Active planning phase. Check whether to renew at current bank or switch. |
| **7 Days Out** | High | WhatsApp / SMS | Immediate action. Inform bank if opting out of auto-renewal. |
| **Maturity Day ($D+0$)** | High | WhatsApp / Push | Congratulate & prompt user to verify that principal + net interest was credited. |
| **Post-Maturity ($D+14$)**| Medium | Email / WhatsApp | Prevent idle cash if user has not logged a reinvestment action. |

---

## 2. Notification Message Templates

### A. 30 Days Out (WhatsApp / Email)
**Subject**: 🔔 Your BRAC Bank FDR is maturing in 30 days — TakaTalks

> *"Hi [Name / User],*  
> 
> *আপনার **BRAC Bank PLC**-তে থাকা **৳২,০০,০০০** টাকার ১-বছর মেয়াদী FDR আগামী **১৫ অক্টোবর ২০২৬** তারিখে ম্যাচিউর হতে যাচ্ছে।*  
> 
> *ব্যাংক যদি অটো-রিনিউ করে ফেলে, তাহলে হয়তো আপনি বর্তমান সময়ের নতুন ভালো রেটগুলো মিস করতে পারেন। এখনই বর্তমান ব্যাংক রেটগুলো দেখে আপনার সিদ্ধান্ত ঠিক করে রাখুন:*  
> 
> *👉 বর্তমান ব্যাংক রেট দেখুন: https://takatalks.com/rates?ref=alert30*  
> 
> *— টিম TakaTalks"*

---

### B. Maturity Day ($D+0$) Confirmation (WhatsApp)
> *"🎉 আপনার **৳২,০০,০০০** টাকার ইনভেস্টমেন্ট আজ ম্যাচিউর হয়েছে!*  
> 
> *টাকা একাউন্টে ঢুকেছে কি না চেক করেছেন?*  
> *আপনার একাউন্টে আসল রিটার্ন নিশ্চিত করতে নিচের লিংকে ক্লিক করে পেয়ে যাওয়া অ্যামাউন্ট কনফার্ম করুন:*  
> 
> *👉 কনফার্ম পে-আউট: https://takatalks.com/tracker?confirm=[investment_id]*"

---

### C. Post-Maturity "Lazy Money" Alert ($D+14$)
> *"⚠️ অলস টাকা ইনফ্লেশনে ক্ষতিগ্রস্থ হচ্ছে!*  
> 
> *আপনার ম্যাচিউর হওয়া **৳২,২২,০০০** টাকা সেভিংস একাউন্টে অলস পড়ে থাকলে বছরে প্রায় ৮-১০% রিয়াল পারচেজিং পাওয়ার হারাতে পারে।*  
> 
> *টাকাটা আবার কোনো হাই-ইল্ড ডিপিএস, এফডিআর বা সঞ্চয়পত্রে রি-ইনভেস্ট করতে চান? সাইন-আপ ছাড়াই ব্যাংক রেট তুলনা করুন:*  
> *👉 https://takatalks.com/rates"*

---

## 3. Channel Integrations

1. **WhatsApp Delivery**:
   - Integrated with the **Tipsoi WhatsApp Business Gateway**.
   - Uses pre-approved Meta WhatsApp Utility Templates to ensure 98%+ delivery rates and 0% spam classification.
2. **Transactional Email**:
   - Sent via Amazon SES or Resend using clean, responsive HTML email templates with `green-deep` styling and zero tracking pixels.
