import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-green-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-green-800 mb-6">
            Smart Orchard Management
          </h1>
          <p className="text-xl text-green-700 mb-8 max-w-3xl mx-auto">
            Track, monitor, and manage your mango orchards with precision. 
            Generate inspection plans and record disease & pest instances to optimize your harvest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors">
              Get Started
            </Link>
            <Link href="/diseases" className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            Everything You Need for Orchard Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-green-50">
              <div className="text-4xl mb-4">🌳</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Orchard Management</h3>
              <p className="text-gray-600">
                Define and track your orchards with detailed characteristics including size, variety, and tree count.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-green-50">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Inspection Plans</h3>
              <p className="text-gray-600">
                Generate comprehensive inspection plans tailored to your orchard's specific needs and conditions.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-green-50">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Disease & Pest Tracking</h3>
              <p className="text-gray-600">
                Record and monitor disease and pest instances to maintain healthy orchards and maximize yields.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-green-700 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-green-200">Active Farmers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2,000+</div>
              <div className="text-green-200">Orchards Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-green-200">Trees Monitored</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-green-200">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Ready to Optimize Your Orchard?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of mango farmers who are already using MangoOrg to improve their yields.
          </p>
        </div>
      </section>
    </div>
  )
}
