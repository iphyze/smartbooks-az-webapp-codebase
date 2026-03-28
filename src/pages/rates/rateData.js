// src/data/invoiceData.js
export const invoiceData = [
  {
    id: 1,
    customer: "GreenTech Nig Ltd",
    invoiceNo: "INV-0460",
    dateIssued: "Oct 04, 2025",
    dueDate: "Oct 18, 2025",
    amount: 125000,
    status: "Paid",
    year: 2025,
    // New fields
    items: [
      {
        description: "Professional Services",
        quantity: 1,
        unitPrice: 100000,
        discountAmount: 5000,
        vatPercent: 7.5,
        lineTotal: 102500
      },
      {
        description: "Consultation",
        quantity: 2,
        unitPrice: 15000,
        discountAmount: 1500,
        vatPercent: 7.5,
        lineTotal: 30000
      }
    ],
    customerEmail: "customer@greentech.ng",
    customerPhone: "+2348000000000",
    customerTin: "1234567890",
    paymentAccount: "first-bank",
    currency: "NGN"
  },
  {
    id: 2,
    customer: "Jumia Logistics",
    invoiceNo: "INV-0459",
    dateIssued: "Oct 04, 2025",
    dueDate: "Oct 18, 2025",
    amount: 310000,
    status: "Rejected",
    year: 2025,
    items: [
      {
        description: "Logistics Services",
        quantity: 1,
        unitPrice: 200000,
        discountAmount: 10000,
        vatPercent: 7.5,
        lineTotal: 205000
      },
      {
        description: "Warehousing",
        quantity: 3,
        unitPrice: 40000,
        discountAmount: 6000,
        vatPercent: 7.5,
        lineTotal: 123000
      }
    ],
    customerEmail: "info@jumialogistics.ng",
    customerPhone: "+2348000000001",
    customerTin: "1234567891",
    paymentAccount: "zenith-bank",
    currency: "NGN"
  },
  {
    id: 3,
    customer: "Bright Farms Ltd",
    invoiceNo: "INV-0458",
    dateIssued: "Oct 04, 2025",
    dueDate: "Oct 18, 2025",
    amount: 95000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Agricultural Products",
        quantity: 1,
        unitPrice: 80000,
        discountAmount: 4000,
        vatPercent: 7.5,
        lineTotal: 82000
      },
      {
        description: "Farm Equipment",
        quantity: 2,
        unitPrice: 10000,
        discountAmount: 1000,
        vatPercent: 7.5,
        lineTotal: 20750
      }
    ],
    customerEmail: "contact@brightfarms.ng",
    customerPhone: "+2348000000002",
    customerTin: "1234567892",
    paymentAccount: "gtbank",
    currency: "NGN"
  },
  {
    id: 4,
    customer: "NovaTech Systems",
    invoiceNo: "INV-0457",
    dateIssued: "Oct 03, 2025",
    dueDate: "Oct 17, 2025",
    amount: 185000,
    status: "Pending",
    year: 2025,
    items: [
      {
        description: "Software Development",
        quantity: 1,
        unitPrice: 150000,
        discountAmount: 7500,
        vatPercent: 7.5,
        lineTotal: 153750
      },
      {
        description: "Technical Support",
        quantity: 1,
        unitPrice: 35000,
        discountAmount: 1750,
        vatPercent: 7.5,
        lineTotal: 35875
      }
    ],
    customerEmail: "support@novatech.ng",
    customerPhone: "+2348000000003",
    customerTin: "1234567893",
    paymentAccount: "access-bank",
    currency: "NGN"
  },
  {
    id: 5,
    customer: "NovaTech Systems",
    invoiceNo: "INV-0456",
    dateIssued: "Oct 03, 2025",
    dueDate: "Oct 17, 2025",
    amount: 220000,
    status: "Pending",
    year: 2025,
    items: [
      {
        description: "Hardware Installation",
        quantity: 1,
        unitPrice: 180000,
        discountAmount: 9000,
        vatPercent: 7.5,
        lineTotal: 184500
      },
      {
        description: "Training Services",
        quantity: 2,
        unitPrice: 20000,
        discountAmount: 2000,
        vatPercent: 7.5,
        lineTotal: 41000
      }
    ],
    customerEmail: "support@novatech.ng",
    customerPhone: "+2348000000003",
    customerTin: "1234567893",
    paymentAccount: "access-bank",
    currency: "NGN"
  },
  {
    id: 6,
    customer: "West Africa Ventures",
    invoiceNo: "INV-0455",
    dateIssued: "Oct 03, 2025",
    dueDate: "Oct 17, 2025",
    amount: 150000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Consulting Services",
        quantity: 1,
        unitPrice: 120000,
        discountAmount: 6000,
        vatPercent: 7.5,
        lineTotal: 123000
      },
      {
        description: "Project Management",
        quantity: 1,
        unitPrice: 30000,
        discountAmount: 1500,
        vatPercent: 7.5,
        lineTotal: 30825
      }
    ],
    customerEmail: "info@westafrica.ventures",
    customerPhone: "+2348000000004",
    customerTin: "1234567894",
    paymentAccount: "first-bank",
    currency: "NGN"
  },
  {
    id: 7,
    customer: "Global Tech Solutions",
    invoiceNo: "INV-0454",
    dateIssued: "Sep 15, 2025",
    dueDate: "Sep 29, 2025",
    amount: 175000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Network Infrastructure",
        quantity: 1,
        unitPrice: 140000,
        discountAmount: 7000,
        vatPercent: 7.5,
        lineTotal: 143500
      },
      {
        description: "Maintenance Contract",
        quantity: 1,
        unitPrice: 35000,
        discountAmount: 1750,
        vatPercent: 7.5,
        lineTotal: 35875
      }
    ],
    customerEmail: "contact@globaltech.ng",
    customerPhone: "+2348000000005",
    customerTin: "1234567895",
    paymentAccount: "zenith-bank",
    currency: "NGN"
  },
  {
    id: 8,
    customer: "African Energy Corp",
    invoiceNo: "INV-0453",
    dateIssued: "Sep 10, 2025",
    dueDate: "Sep 24, 2025",
    amount: 200000,
    status: "Rejected",
    year: 2025,
    items: [
      {
        description: "Solar Panel Installation",
        quantity: 1,
        unitPrice: 160000,
        discountAmount: 8000,
        vatPercent: 7.5,
        lineTotal: 164000
      },
      {
        description: "Battery Backup System",
        quantity: 1,
        unitPrice: 40000,
        discountAmount: 2000,
        vatPercent: 7.5,
        lineTotal: 41000
      }
    ],
    customerEmail: "info@africanenergy.ng",
    customerPhone: "+2348000000006",
    customerTin: "1234567896",
    paymentAccount: "gtbank",
    currency: "NGN"
  },
  {
    id: 9,
    customer: "Nigeria Telecom Ltd",
    invoiceNo: "INV-0452",
    dateIssued: "Aug 22, 2025",
    dueDate: "Sep 05, 2025",
    amount: 300000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Telecommunication Equipment",
        quantity: 1,
        unitPrice: 240000,
        discountAmount: 12000,
        vatPercent: 7.5,
        lineTotal: 246000
      },
      {
        description: "Installation Services",
        quantity: 1,
        unitPrice: 60000,
        discountAmount: 3000,
        vatPercent: 7.5,
        lineTotal: 61500
      }
    ],
    customerEmail: "support@nigeriatelecom.ng",
    customerPhone: "+2348000000007",
    customerTin: "1234567897",
    paymentAccount: "access-bank",
    currency: "NGN"
  },
  {
    id: 10,
    customer: "Lagos Manufacturing",
    invoiceNo: "INV-0451",
    dateIssued: "Aug 15, 2025",
    dueDate: "Aug 29, 2025",
    amount: 250000,
    status: "Pending",
    year: 2025,
    items: [
      {
        description: "Industrial Machinery",
        quantity: 1,
        unitPrice: 200000,
        discountAmount: 10000,
        vatPercent: 7.5,
        lineTotal: 205000
      },
      {
        description: "Maintenance Services",
        quantity: 1,
        unitPrice: 50000,
        discountAmount: 2500,
        vatPercent: 7.5,
        lineTotal: 51250
      }
    ],
    customerEmail: "info@lagosmanufacturing.ng",
    customerPhone: "+2348000000008",
    customerTin: "1234567898",
    paymentAccount: "first-bank",
    currency: "NGN"
  },
  {
    id: 11,
    customer: "Alpha Solutions Ltd",
    invoiceNo: "INV-0450",
    dateIssued: "Aug 10, 2025",
    dueDate: "Aug 24, 2025",
    amount: 175000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Software Licensing",
        quantity: 1,
        unitPrice: 150000,
        discountAmount: 7500,
        vatPercent: 7.5,
        lineTotal: 153750
      },
      {
        description: "Technical Support",
        quantity: 1,
        unitPrice: 25000,
        discountAmount: 1250,
        vatPercent: 7.5,
        lineTotal: 25875
      }
    ],
    customerEmail: "contact@alphasol.com",
    customerPhone: "+2348000000001",
    customerTin: "23456789-0002",
    paymentAccount: "zenith-bank",
    currency: "NGN"
  },
  {
    id: 12,
    customer: "Beta Enterprises",
    invoiceNo: "INV-0449",
    dateIssued: "Aug 05, 2025",
    dueDate: "Aug 19, 2025",
    amount: 220000,
    status: "Pending",
    year: 2025,
    items: [
      {
        description: "Equipment Rental",
        quantity: 2,
        unitPrice: 80000,
        discountAmount: 8000,
        vatPercent: 7.5,
        lineTotal: 164000
      },
      {
        description: "Installation Services",
        quantity: 1,
        unitPrice: 60000,
        discountAmount: 3000,
        vatPercent: 7.5,
        lineTotal: 61500
      }
    ],
    customerEmail: "hello@betaent.com",
    customerPhone: "+2348000000002",
    customerTin: "34567890-0003",
    paymentAccount: "gtbank",
    currency: "NGN"
  },
  {
    id: 13,
    customer: "Gamma Services",
    invoiceNo: "INV-0448",
    dateIssued: "Jul 28, 2025",
    dueDate: "Aug 11, 2025",
    amount: 130000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Consulting Services",
        quantity: 1,
        unitPrice: 100000,
        discountAmount: 5000,
        vatPercent: 7.5,
        lineTotal: 102500
      },
      {
        description: "Training Materials",
        quantity: 1,
        unitPrice: 30000,
        discountAmount: 1500,
        vatPercent: 7.5,
        lineTotal: 30825
      }
    ],
    customerEmail: "info@gamma-serv.net",
    customerPhone: "+2348000000003",
    customerTin: "45678901-0004",
    paymentAccount: "access-bank",
    currency: "NGN"
  },
  {
    id: 14,
    customer: "Delta Industries",
    invoiceNo: "INV-0447",
    dateIssued: "Jul 20, 2025",
    dueDate: "Aug 03, 2025",
    amount: 280000,
    status: "Rejected",
    year: 2025,
    items: [
      {
        description: "Industrial Equipment",
        quantity: 1,
        unitPrice: 200000,
        discountAmount: 10000,
        vatPercent: 7.5,
        lineTotal: 205000
      },
      {
        description: "Installation & Training",
        quantity: 1,
        unitPrice: 80000,
        discountAmount: 4000,
        vatPercent: 7.5,
        lineTotal: 82000
      }
    ],
    customerEmail: "contact@delta-ind.com",
    customerPhone: "+2348000000004",
    customerTin: "56789012-0005",
    paymentAccount: "first-bank",
    currency: "NGN"
  },
  {
    id: 15,
    customer: "Abuja Financial Services",
    invoiceNo: "INV-0446",
    dateIssued: "Jul 15, 2025",
    dueDate: "Jul 29, 2025",
    amount: 195000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Financial Software",
        quantity: 1,
        unitPrice: 150000,
        discountAmount: 7500,
        vatPercent: 7.5,
        lineTotal: 153750
      },
      {
        description: "Implementation Services",
        quantity: 1,
        unitPrice: 45000,
        discountAmount: 2250,
        vatPercent: 7.5,
        lineTotal: 46275
      }
    ],
    customerEmail: "info@abujafinancial.ng",
    customerPhone: "+2348000000009",
    customerTin: "1234567899",
    paymentAccount: "zenith-bank",
    currency: "NGN"
  },
  {
    id: 16,
    customer: "Port Harcourt Oil Co",
    invoiceNo: "INV-0445",
    dateIssued: "Jul 10, 2025",
    dueDate: "Jul 24, 2025",
    amount: 350000,
    status: "Pending",
    year: 2025,
    items: [
      {
        description: "Oil Processing Equipment",
        quantity: 1,
        unitPrice: 250000,
        discountAmount: 12500,
        vatPercent: 7.5,
        lineTotal: 256250
      },
      {
        description: "Maintenance Contract",
        quantity: 1,
        unitPrice: 100000,
        discountAmount: 5000,
        vatPercent: 7.5,
        lineTotal: 102500
      }
    ],
    customerEmail: "info@portharcourt.ng",
    customerPhone: "+2348000000010",
    customerTin: "1234567890",
    paymentAccount: "gtbank",
    currency: "NGN"
  },
  {
    id: 17,
    customer: "Kano Agriculture Ltd",
    invoiceNo: "INV-0444",
    dateIssued: "Jul 05, 2025",
    dueDate: "Jul 19, 2025",
    amount: 165000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Agricultural Equipment",
        quantity: 1,
        unitPrice: 120000,
        discountAmount: 6000,
        vatPercent: 7.5,
        lineTotal: 123000
      },
      {
        description: "Training Services",
        quantity: 1,
        unitPrice: 45000,
        discountAmount: 2250,
        vatPercent: 7.5,
        lineTotal: 46275
      }
    ],
    customerEmail: "info@kanoagri.ng",
    customerPhone: "+2348000000011",
    customerTin: "34567890-0013",
    paymentAccount: "access-bank",
    currency: "NGN"
  },
  {
    id: 18,
    customer: "Ibadan Textile Mills",
    invoiceNo: "INV-0443",
    dateIssued: "Jun 28, 2025",
    dueDate: "Jul 12, 2025",
    amount: 210000,
    status: "Pending",
    year: 2025,
    items: [
      {
        description: "Textile Machinery",
        quantity: 1,
        unitPrice: 150000,
        discountAmount: 7500,
        vatPercent: 7.5,
        lineTotal: 153750
      },
      {
        description: "Installation Services",
        quantity: 1,
        unitPrice: 60000,
        discountAmount: 3000,
        vatPercent: 7.5,
        lineTotal: 61500
      }
    ],
    customerEmail: "info@ibadantextile.ng",
    customerPhone: "+2348000000012",
    customerTin: "34567890-0014",
    paymentAccount: "first-bank",
    currency: "NGN"
  },
  {
    id: 19,
    customer: "Enugu Mining Corp",
    invoiceNo: "INV-0442",
    dateIssued: "Jun 20, 2025",
    dueDate: "Jul 04, 2025",
    amount: 400000,
    status: "Rejected",
    year: 2025,
    items: [
      {
        description: "Mining Equipment",
        quantity: 1,
        unitPrice: 300000,
        discountAmount: 15000,
        vatPercent: 7.5,
        lineTotal: 307500
      },
      {
        description: "Safety Equipment",
        quantity: 1,
        unitPrice: 100000,
        discountAmount: 5000,
        vatPercent: 7.5,
        lineTotal: 102500
      }
    ],
    customerEmail: "info@enugumine.ng",
    customerPhone: "+2348000000013",
    customerTin: "34567890-0015",
    paymentAccount: "zenith-bank",
    currency: "NGN"
  },
  {
    id: 20,
    customer: "Benin Construction",
    invoiceNo: "INV-0441",
    dateIssued: "Jun 15, 2025",
    dueDate: "Jun 29, 2025",
    amount: 275000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Construction Materials",
        quantity: 1,
        unitPrice: 200000,
        discountAmount: 10000,
        vatPercent: 7.5,
        lineTotal: 205000
      },
      {
        description: "Labor Services",
        quantity: 1,
        unitPrice: 75000,
        discountAmount: 3750,
        vatPercent: 7.5,
        lineTotal: 76875
      }
    ],
    customerEmail: "info@beninconstruct.ng",
    customerPhone: "+2348000000014",
    customerTin: "34567890-0016",
    paymentAccount: "gtbank",
    currency: "NGN"
  },
  {
    id: 21,
    customer: "Calabar Shipping Ltd",
    invoiceNo: "INV-0440",
    dateIssued: "Jun 10, 2025",
    dueDate: "Jun 24, 2025",
    amount: 320000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Shipping Containers",
        quantity: 2,
        unitPrice: 120000,
        discountAmount: 12000,
        vatPercent: 7.5,
        lineTotal: 246000
      },
      {
        description: "Logistics Services",
        quantity: 1,
        unitPrice: 80000,
        discountAmount: 4000,
        vatPercent: 7.5,
        lineTotal: 82000
      }
    ],
    customerEmail: "info@calabarship.ng",
    customerPhone: "+2348000000015",
    customerTin: "34567890-0017",
    paymentAccount: "access-bank",
    currency: "NGN"
  },
  {
    id: 22,
    customer: "Jos Technology Park",
    invoiceNo: "INV-0439",
    dateIssued: "Jun 05, 2025",
    dueDate: "Jun 19, 2025",
    amount: 185000,
    status: "Pending",
    year: 2025,
    items: [
      {
        description: "Office Space Rental",
        quantity: 3,
        unitPrice: 50000,
        discountAmount: 7500,
        vatPercent: 7.5,
        lineTotal: 153750
      },
      {
        description: "IT Infrastructure",
        quantity: 1,
        unitPrice: 35000,
        discountAmount: 1750,
        vatPercent: 7.5,
        lineTotal: 35875
      }
    ],
    customerEmail: "info@jostechpark.ng",
    customerPhone: "+2348000000016",
    customerTin: "34567890-0018",
    paymentAccount: "first-bank",
    currency: "NGN"
  },
  {
    id: 23,
    customer: "Warri Refinery",
    invoiceNo: "INV-0438",
    dateIssued: "May 28, 2025",
    dueDate: "Jun 11, 2025",
    amount: 450000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Refinery Equipment",
        quantity: 1,
        unitPrice: 350000,
        discountAmount: 17500,
        vatPercent: 7.5,
        lineTotal: 358750
      },
      {
        description: "Installation Services",
        quantity: 1,
        unitPrice: 100000,
        discountAmount: 5000,
        vatPercent: 7.5,
        lineTotal: 102500
      }
    ],
    customerEmail: "info@warrirefinery.ng",
    customerPhone: "+2348000000017",
    customerTin: "34567890-0019",
    paymentAccount: "zenith-bank",
    currency: "NGN"
  },
  {
    id: 24,
    customer: "Sokoto Farming Co",
    invoiceNo: "INV-0437",
    dateIssued: "May 20, 2025",
    dueDate: "Jun 03, 2025",
    amount: 145000,
    status: "Rejected",
    year: 2025,
    items: [
      {
        description: "Farming Equipment",
        quantity: 1,
        unitPrice: 100000,
        discountAmount: 5000,
        vatPercent: 7.5,
        lineTotal: 102500
      },
      {
        description: "Seeds & Fertilizers",
        quantity: 1,
        unitPrice: 45000,
        discountAmount: 2250,
        vatPercent: 7.5,
        lineTotal: 46275
      }
    ],
    customerEmail: "info@sokotofarm.ng",
    customerPhone: "+2348000000018",
    customerTin: "34567890-0020",
    paymentAccount: "gtbank",
    currency: "NGN"
  },
  {
    id: 25,
    customer: "Oyo Manufacturing",
    invoiceNo: "INV-0436",
    dateIssued: "May 15, 2025",
    dueDate: "May 29, 2025",
    amount: 235000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Manufacturing Equipment",
        quantity: 1,
        unitPrice: 180000,
        discountAmount: 9000,
        vatPercent: 7.5,
        lineTotal: 184500
      },
      {
        description: "Quality Control Systems",
        quantity: 1,
        unitPrice: 55000,
        discountAmount: 2750,
        vatPercent: 7.5,
        lineTotal: 56625
      }
    ],
    customerEmail: "info@yomamanufacturing.ng",
    customerPhone: "+2348000000019",
    customerTin: "34567890-0021",
    paymentAccount: "access-bank",
    currency: "NGN"
  },
  {
    id: 26,
    customer: "Akwa Ibom Oil",
    invoiceNo: "INV-0435",
    dateIssued: "May 10, 2025",
    dueDate: "May 24, 2025",
    amount: 380000,
    status: "Pending",
    year: 2025,
    items: [
      {
        description: "Oil Drilling Equipment",
        quantity: 1,
        unitPrice: 280000,
        discountAmount: 14000,
        vatPercent: 7.5,
        lineTotal: 287000
      },
      {
        description: "Safety Training",
        quantity: 1,
        unitPrice: 100000,
        discountAmount: 5000,
        vatPercent: 7.5,
        lineTotal: 102500
      }
    ],
    customerEmail: "info@akwaibomoil.ng",
    customerPhone: "+2348000000020",
    customerTin: "34567890-0022",
    paymentAccount: "first-bank",
    currency: "NGN"
  },
  {
    id: 27,
    customer: "Rivers Transport",
    invoiceNo: "INV-0434",
    dateIssued: "May 05, 2025",
    dueDate: "May 19, 2025",
    amount: 165000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Transport Vehicles",
        quantity: 1,
        unitPrice: 120000,
        discountAmount: 6000,
        vatPercent: 7.5,
        lineTotal: 123000
      },
      {
        description: "Fleet Management Software",
        quantity: 1,
        unitPrice: 45000,
        discountAmount: 2250,
        vatPercent: 7.5,
        lineTotal: 46275
      }
    ],
    customerEmail: "info@riverstransport.ng",
    customerPhone: "+2348000000021",
    customerTin: "34567890-0023",
    paymentAccount: "zenith-bank",
    currency: "NGN"
  },
  {
    id: 28,
    customer: "Delta Steel Mills",
    invoiceNo: "INV-0433",
    dateIssued: "Apr 28, 2025",
    dueDate: "May 12, 2025",
    amount: 420000,
    status: "Rejected",
    year: 2025,
    items: [
      {
        description: "Steel Processing Machinery",
        quantity: 1,
        unitPrice: 320000,
        discountAmount: 16000,
        vatPercent: 7.5,
        lineTotal: 328000
      },
      {
        description: "Quality Testing Equipment",
        quantity: 1,
        unitPrice: 100000,
        discountAmount: 5000,
        vatPercent: 7.5,
        lineTotal: 102500
      }
    ],
    customerEmail: "info@deltasteelmills.ng",
    customerPhone: "+2348000000022",
    customerTin: "34567890-0024",
    paymentAccount: "gtbank",
    currency: "NGN"
  },
  {
    id: 29,
    customer: "Anambra Trading Co",
    invoiceNo: "INV-0432",
    dateIssued: "Apr 20, 2025",
    dueDate: "May 04, 2025",
    amount: 195000,
    status: "Paid",
    year: 2025,
    items: [
      {
        description: "Trading Goods",
        quantity: 1,
        unitPrice: 150000,
        discountAmount: 7500,
        vatPercent: 7.5,
        lineTotal: 153750
      },
      {
        description: "Storage Services",
        quantity: 1,
        unitPrice: 45000,
        discountAmount: 2250,
        vatPercent: 7.5,
        lineTotal: 46275
      }
    ],
    customerEmail: "info@anambra.com",
    customerPhone: "+2348000000023",
    customerTin: "34567890-0025",
    paymentAccount: "access-bank",
    currency: "NGN"
  },
  {
    id: 30,
    customer: "Kogi Minerals",
    invoiceNo: "INV-0431",
    dateIssued: "Apr 15, 2025",
    dueDate: "Apr 29, 2025",
    amount: 285000,
    status: "Pending",
    year: 2025,
    items: [
      {
        description: "Mining Equipment",
        quantity: 1,
        unitPrice: 200000,
        discountAmount: 10000,
        vatPercent: 7.5,
        lineTotal: 205000
      },
      {
        description: "Processing Plant",
        quantity: 1,
        unitPrice: 85000,
        discountAmount: 4250,
        vatPercent: 7.5,
        lineTotal: 87425
      }
    ],
    customerEmail: "info@kogimineral.ng",
    customerPhone: "+2348000000024",
    customerTin: "34567890-0026",
    paymentAccount: "first-bank",
    currency: "NGN"
  }
];