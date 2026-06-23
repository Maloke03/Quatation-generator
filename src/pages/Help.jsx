import { useState } from 'react';
// eslint-disable-next-line
import { TopBar, Card, Button } from '../components/UI';
// eslint-disable-next-line
import {  ChevronLeft, ChevronDown, ChevronRight,BookOpen,Users,FileText,Receipt,Briefcase,Package,UserCheck,Calendar,Smartphone,CreditCard,HelpCircle,Mail,Phone
} from 'lucide-react';

export default function Help({ navigate }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    {
      id: 'getting-started',
      icon: BookOpen,
      title: 'Getting Started',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Create an Account</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Open the app and tap <span className="text-green-400">"Get Started Free"</span></li>
              <li>Tap <span className="text-green-400">"Sign Up"</span> at the bottom</li>
              <li>Enter your <span className="text-white">Email</span> and <span className="text-white">Password</span></li>
              <li>Tap <span className="text-green-400">"Create Account"</span></li>
              <li>Check your email for confirmation link</li>
            </ol>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Sign In</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Enter your <span className="text-white">Email</span> and <span className="text-white">Password</span></li>
              <li>Tap <span className="text-green-400">"Sign In"</span></li>
              <li>You'll see the <span className="text-white">Dashboard</span></li>
            </ol>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Forgot Password?</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Tap <span className="text-yellow-400">"Forgot Password?"</span> on login screen</li>
              <li>Enter your email address</li>
              <li>Tap <span className="text-green-400">"Send Reset Link"</span></li>
              <li>Check your email for reset instructions</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      icon: BookOpen,
      title: 'Dashboard',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>The Dashboard gives you an overview of your business:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#1e3a2a] rounded-lg p-2 text-center">
              <span className="text-green-400 font-bold">Total Quotes</span>
              <p className="text-xs text-gray-500">All quotations</p>
            </div>
            <div className="bg-[#1e3a2a] rounded-lg p-2 text-center">
              <span className="text-green-400 font-bold">Clients</span>
              <p className="text-xs text-gray-500">Your clients</p>
            </div>
            <div className="bg-[#1e3a2a] rounded-lg p-2 text-center">
              <span className="text-yellow-400 font-bold">Pending</span>
              <p className="text-xs text-gray-500">Awaiting response</p>
            </div>
            <div className="bg-[#1e3a2a] rounded-lg p-2 text-center">
              <span className="text-blue-400 font-bold">Projects</span>
              <p className="text-xs text-gray-500">Active projects</p>
            </div>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <p className="text-gray-400">💡 <span className="text-white">Quick Action:</span> Tap <span className="text-green-400">"+ New Quote"</span> to create a quotation</p>
          </div>
        </div>
      )
    },
    {
      id: 'clients',
      icon: Users,
      title: 'Managing Clients',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Add a Client</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Tap <span className="text-green-400">Clients</span> tab at the bottom</li>
              <li>Tap <span className="text-green-400">"Add Client"</span></li>
              <li>Fill in: <span className="text-white">Name</span>, <span className="text-white">Phone</span>, <span className="text-white">Email</span>, <span className="text-white">Location</span></li>
              <li>Tap <span className="text-green-400">"Save Client"</span></li>
            </ol>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Edit/Delete Client</h4>
            <p className="text-gray-400">Tap ✏️ to edit or 🗑️ to delete a client</p>
          </div>
        </div>
      )
    },
    {
      id: 'quotations',
      icon: FileText,
      title: 'Creating Quotations',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">New Quotation</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Tap <span className="text-green-400">Quotations</span> tab</li>
              <li>Tap <span className="text-green-400">"New Quote"</span></li>
              <li>Select a <span className="text-white">Client</span></li>
              <li>Enter <span className="text-white">Project Name</span></li>
              <li>Add items (materials, labour)</li>
              <li>Tap <span className="text-green-400">"Save Quotation"</span></li>
            </ol>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Quick Add Options</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>📦 <span className="text-white">Pick from Inventory</span> - Use your stock</li>
              <li>💰 <span className="text-white">Price List</span> - Use saved prices</li>
              <li>👷 <span className="text-white">Add Labour</span> - Add labour costs</li>
            </ul>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Share Quotation</h4>
            <p className="text-gray-400">Open the quotation → Tap <span className="text-green-400">"Share on WhatsApp"</span></p>
          </div>
        </div>
      )
    },
    {
      id: 'invoices',
      icon: Receipt,
      title: 'Invoices & Payments',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Convert Quote to Invoice</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Open an <span className="text-white">Accepted</span> quotation</li>
              <li>Tap <span className="text-green-400">"Convert to Invoice"</span></li>
              <li>Invoice is created automatically</li>
            </ol>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Record Payment</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Open the invoice</li>
              <li>Tap <span className="text-green-400">"Record Payment"</span></li>
              <li>Enter <span className="text-white">Amount</span>, <span className="text-white">Date</span>, <span className="text-white">Method</span></li>
              <li>Tap <span className="text-green-400">"Save Payment"</span></li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'projects',
      icon: Briefcase,
      title: 'Projects & Expenses',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Create a Project</h4>
            <p className="text-gray-400">Accept a quotation → Tap <span className="text-blue-400">"Create Project"</span></p>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Track Project Status</h4>
            <div className="space-y-1">
              <p className="text-gray-400">⚪ <span className="text-white">Not Started</span> - Project not yet begun</p>
              <p className="text-gray-400">🟡 <span className="text-yellow-400">In Progress</span> - Work is ongoing</p>
              <p className="text-gray-400">✅ <span className="text-green-400">Completed</span> - Work is finished</p>
            </div>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Add Expenses</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Open the project</li>
              <li>Tap <span className="text-green-400">"Add Expense"</span></li>
              <li>Enter <span className="text-white">Description</span>, <span className="text-white">Amount</span>, <span className="text-white">Category</span></li>
              <li>Tap <span className="text-green-400">"Save Expense"</span></li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'inventory',
      icon: Package,
      title: 'Materials & Inventory',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Material Price Database</h4>
            <p className="text-gray-400">Tap <span className="text-green-400">Materials</span> tab → Add materials with prices</p>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Inventory Management</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li><span className="text-green-400">Add Stock</span> - Add new materials</li>
              <li><span className="text-green-400">Add</span> - Increase stock (purchases)</li>
              <li><span className="text-red-400">Use</span> - Decrease stock (usage)</li>
            </ul>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Low Stock Alerts</h4>
            <p className="text-gray-400">🔴 Red alert appears when stock is low</p>
          </div>
        </div>
      )
    },
    {
      id: 'workers',
      icon: UserCheck,
      title: 'Workers & Attendance',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Add Workers</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Tap <span className="text-green-400">Workers</span> tab</li>
              <li>Tap <span className="text-green-400">"Add Worker"</span></li>
              <li>Enter <span className="text-white">Name</span>, <span className="text-white">Role</span>, <span className="text-white">Daily Rate</span></li>
              <li>Tap <span className="text-green-400">"Save Worker"</span></li>
            </ol>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Daily Attendance</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Tap <span className="text-green-400">Attendance</span> tab</li>
              <li>Select the date</li>
              <li>Mark: ✅ Present | ❌ Absent | 🌓 Half Day</li>
              <li>Tap <span className="text-green-400">"Save All Attendance"</span></li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'subscription',
      icon: CreditCard,
      title: 'Subscription & Payments',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Free Trial</h4>
            <p className="text-gray-400">✅ <span className="text-white">30-day free trial</span> when you sign up</p>
            <p className="text-gray-400 text-xs">No credit card required</p>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Subscribe (M200/month)</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Tap <span className="text-green-400">"Subscribe Now"</span></li>
              <li>Choose <span className="text-white">M-Pesa</span> or <span className="text-white">EcoCash</span></li>
              <li>Send M200 to the number shown</li>
              <li>Enter the <span className="text-white">reference number</span></li>
              <li>Submit for verification</li>
            </ol>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Payment Numbers</h4>
            <div className="space-y-1">
              <p className="text-gray-400">📱 <span className="text-white">M-Pesa:</span> <span className="text-green-400">58863757</span></p>
              <p className="text-gray-400">📱 <span className="text-white">EcoCash:</span> <span className="text-green-400">63980310</span></p>
              <p className="text-gray-400">👤 <span className="text-white">Name:</span> Thabelo Maloke</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      icon: HelpCircle,
      title: 'FAQ',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">How do I install QuotePro on my phone?</h4>
            <p className="text-gray-400">Open the app URL in Chrome/Safari → Tap <span className="text-white">"Add to Home Screen"</span></p>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">What happens if my trial expires?</h4>
            <p className="text-gray-400">You'll see the subscription page. Subscribe to continue using the app.</p>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">Can I use QuotePro offline?</h4>
            <p className="text-gray-400">Yes! QuotePro works offline. Data syncs when you're back online.</p>
          </div>
          <div className="bg-[#1e3a2a] rounded-lg p-3">
            <h4 className="font-semibold text-white mb-2">How do I contact support?</h4>
            <div className="space-y-1">
              <p className="text-gray-400">📧 <span className="text-white">Email:</span> malokethabelo03@gmail.com</p>
              <p className="text-gray-400">📱 <span className="text-white">Phone:</span> +266 63980310</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="flex flex-col min-h-full pb-24">
      <TopBar
        title="Help & Guide"
        left={
          <button onClick={() => navigate('settings')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Header */}
        <Card>
          <div className="text-center py-3">
            <div className="text-4xl mb-2">📖</div>
            <h2 className="text-xl font-bold text-white">User Guide</h2>
            <p className="text-sm text-gray-400">Learn how to use QuotePro</p>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2">
          {sections.slice(0, 4).map((section) => (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className="bg-[#1e3a2a] border border-[#2d5a3d] rounded-lg p-3 hover:border-green-700 transition-colors text-center"
            >
              <section.icon size={20} className="text-green-400 mx-auto mb-1" />
              <span className="text-xs text-white">{section.title}</span>
            </button>
          ))}
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.id}>
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full bg-[#1e3a2a] border border-[#2d5a3d] rounded-lg p-3 flex items-center justify-between hover:border-green-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <section.icon size={18} className="text-green-400" />
                <span className="text-white font-medium text-sm">{section.title}</span>
              </div>
              {expandedSection === section.id ? (
                <ChevronDown size={18} className="text-gray-400" />
              ) : (
                <ChevronRight size={18} className="text-gray-400" />
              )}
            </button>
            {expandedSection === section.id && (
              <div className="mt-2">
                <Card>
                  {section.content}
                </Card>
              </div>
            )}
          </div>
        ))}

        {/* Contact Support */}
        <Card>
          <div className="text-center py-2">
            <h3 className="font-semibold text-white mb-2">Need Help?</h3>
            <div className="flex justify-center gap-4 text-sm">
              <div className="text-center">
                <Mail size={18} className="text-green-400 mx-auto mb-1" />
                <p className="text-gray-400 text-xs">Email</p>
                <p className="text-white text-xs">malokethabelo03@gmail.com</p>
              </div>
              <div className="text-center">
                <Phone size={18} className="text-green-400 mx-auto mb-1" />
                <p className="text-gray-400 text-xs">Phone</p>
                <p className="text-white text-xs">+266 63980310</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}