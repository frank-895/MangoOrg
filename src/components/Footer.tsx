export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-2">
          <p>
            <a 
              href="https://github.com/frank-895/MangoOrg/blob/main/LICENSE" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              MIT Licence
            </a>
          </p>
          <p className="text-gray-300">
            This web application was built as part of a research project for Charles Darwin University.
          </p>
        </div>
      </div>
    </footer>
  )
}
