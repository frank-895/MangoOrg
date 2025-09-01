export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">🍊 MangoOrg</h3>
            <p className="text-gray-300 text-sm">
              Empowering mango farmers with smart orchard management and disease tracking.
            </p>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Orchard Management</li>
              <li>Inspection Planning</li>
              <li>Disease Tracking</li>
              <li>Pest Monitoring</li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>FAQ</li>
              <li>Documentation</li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>About Us</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Newsletter</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 MangoOrg. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
