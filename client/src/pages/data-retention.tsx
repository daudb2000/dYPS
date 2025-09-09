import { Link } from "wouter";

export default function DataRetention() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* White space at top already provided by py-16 */}
        
        {/* Header with underline */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Data Retention Policy</h1>
          <div className="w-72 h-px bg-border"></div>
        </div>
        
        {/* Policy Content */}
        <div className="prose prose-slate max-w-none text-foreground space-y-8">
          <div>
            <p className="text-lg font-medium mb-4">Last updated: 9 September 2025</p>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">1. Introduction and Scope</h2>
            <p className="mb-4 leading-relaxed">
              This Data Retention and Processing Policy ("<strong>Policy</strong>") sets out the approach adopted by DYPS ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") regarding the collection, processing, retention, and disposal of personal data obtained through our membership application process. This Policy applies to all personal data processed by DYPS in connection with membership applications submitted via our website and related services.
            </p>
            <p className="mb-4 leading-relaxed">
              DYPS is an unincorporated professional society operating as a membership organisation under a formal constitution. For the purposes of applicable data protection legislation, including the UK General Data Protection Regulation ("<strong>UK GDPR</strong>") and the Data Protection Act 2018 ("<strong>DPA 2018</strong>"), DYPS acts as the data controller in respect of the personal data described in this Policy.
            </p>
            <p className="mb-4 leading-relaxed">
              <strong>Data Controller Details:</strong><br />
              Organisation: DYPS<br />
              Data Protection Contact: Daud@dyps.uk
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">2. Categories of Personal Data Processed</h2>
            <p className="mb-4 leading-relaxed">
              In furtherance of our legitimate business interests in operating as a professional membership organisation, we collect and process the following categories of personal data from prospective members:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identity Data:</strong> comprising full legal name as provided by the applicant;</li>
              <li><strong>Contact Data:</strong> comprising primary email address for correspondence purposes;</li>
              <li><strong>Professional Data:</strong> comprising current job role or professional title and employing organisation or company name;</li>
              <li><strong>Application Data:</strong> comprising any additional information voluntarily provided as part of the application submission process.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">3. Purposes and Legal Basis for Processing</h2>
            
            <h3 className="text-lg font-medium mb-3 text-foreground">3.1 Primary Processing Purposes</h3>
            <p className="mb-4 leading-relaxed">
              We process the aforementioned personal data for the following specified, explicit, and legitimate purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>To conduct a comprehensive assessment and evaluation of membership applications in accordance with our established criteria and procedures;</li>
              <li>To facilitate communication with applicants regarding the status, progress, and outcome of their applications;</li>
              <li>To maintain accurate and up-to-date membership records and contact databases for successful applicants;</li>
              <li>To ensure the integrity, security, and proper administration of our application and membership processes;</li>
              <li>To prevent, detect, and respond to potential misuse, abuse, or fraudulent activity in connection with our services.</li>
            </ul>

            <h3 className="text-lg font-medium mb-3 text-foreground">3.2 Legal Basis</h3>
            <p className="mb-4 leading-relaxed">
              Our processing activities are conducted in reliance upon Article 6(1)(f) of the UK GDPR, namely our legitimate interests in operating as a professional membership organisation, managing applications efficiently, maintaining membership records, and protecting the integrity of our processes. We have conducted appropriate balancing assessments to ensure that our legitimate interests do not override the fundamental rights and freedoms of data subjects.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">4. Application Review and Response Framework</h2>
            
            <h3 className="text-lg font-medium mb-3 text-foreground">4.1 Operational Constraints</h3>
            <p className="mb-4 leading-relaxed">
              Prospective applicants should be aware that DYPS currently operates with limited human resources and administrative capacity. Consequently, during periods of high application volume or operational demands, we may be unable to provide individual responses to all applicants within standard timeframes. While we endeavour to review and process all applications received, response times may vary significantly based on operational circumstances beyond our immediate control.
            </p>

            <h3 className="text-lg font-medium mb-3 text-foreground">4.2 No Guarantee of Response</h3>
            <p className="mb-4 leading-relaxed">
              The submission of an application does not create any obligation on our part to provide a substantive response or feedback. Our ability to respond to applications is subject to available resources and operational priorities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">5. Data Retention Periods and Disposal</h2>
            
            <h3 className="text-lg font-medium mb-3 text-foreground">5.1 Successful Applications</h3>
            <p className="mb-4 leading-relaxed">Where an application results in successful admission to membership:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Personal data will be transferred to our primary membership database, currently maintained using the Notion platform;</li>
              <li>Such data will be retained for the duration of the individual's membership status;</li>
              <li>Upon written request to DYPS management, or upon termination of membership, personal data will be permanently deleted from our systems within a reasonable timeframe;</li>
              <li>Successful applicants may request deletion of their personal data at any time by contacting our designated data protection contact.</li>
            </ul>

            <h3 className="text-lg font-medium mb-3 text-foreground">5.2 Unsuccessful Applications</h3>
            <p className="mb-4 leading-relaxed">Where an application does not result in admission to membership:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>All associated personal data will be permanently and irreversibly deleted from our systems within thirty (30) calendar days of the final determination;</li>
              <li>Where operationally feasible, applicants will receive notification of the application outcome prior to data deletion;</li>
              <li>No backup copies or archived versions of unsuccessful application data will be retained beyond this period.</li>
            </ul>

            <h3 className="text-lg font-medium mb-3 text-foreground">5.3 Policy Violations and Protective Measures</h3>
            <p className="mb-4 leading-relaxed">
              In circumstances where we have reasonable grounds to believe that an applicant has engaged in conduct that constitutes a violation of our policies, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Submission of fraudulent, misleading, or deliberately false application information;</li>
              <li>Harassment of DYPS members, staff, or representatives;</li>
              <li>Misconduct at DYPS events, activities, or in connection with DYPS-related matters;</li>
              <li>Repeated submission of applications following explicit rejection;</li>
              <li>Any other conduct deemed detrimental to the interests or reputation of DYPS;</li>
            </ul>
            <p className="mb-4 leading-relaxed">
              We reserve the right to retain limited personal data (specifically, name and email address) on a secure, access-restricted system for protective purposes. Such data will be:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mb-6">
              <li>Maintained on a confidential basis and not accessible to general DYPS team members;</li>
              <li>Retained for an initial period of six (6) months from the date of the relevant incident;</li>
              <li>Subject to periodic review at six-month intervals to determine whether continued retention remains necessary and proportionate;</li>
              <li>Permanently deleted when no longer required for protective purposes.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">6. Third-Party Data Processors and International Transfers</h2>
            
            <h3 className="text-lg font-medium mb-3 text-foreground">6.1 Email Communications</h3>
            <p className="mb-4 leading-relaxed">
              For the purpose of sending automated email communications, including application confirmations and status updates, we utilise NodeMailer technology in conjunction with Gmail services provided by Google LLC. Google LLC operates under appropriate data protection frameworks and maintains suitable technical and organisational measures for the protection of personal data.
            </p>

            <h3 className="text-lg font-medium mb-3 text-foreground">6.2 Data Storage and Management</h3>
            <p className="mb-4 leading-relaxed">
              Successful applicant data is stored and managed using the Notion platform operated by Notion Labs, Inc. This platform provides secure cloud-based database functionality with appropriate security controls and access restrictions.
            </p>

            <h3 className="text-lg font-medium mb-3 text-foreground">6.3 Website Hosting</h3>
            <p className="mb-4 leading-relaxed">
              Our website and associated application infrastructure are hosted by GoDaddy Operating Company, LLC ("<strong>GoDaddy</strong>"). GoDaddy maintains industry-standard security measures and operates in compliance with applicable data protection requirements.
            </p>

            <h3 className="text-lg font-medium mb-3 text-foreground">6.4 Processor Obligations</h3>
            <p className="mb-4 leading-relaxed">
              All third-party service providers acting as data processors on our behalf are selected based on their ability to provide sufficient guarantees regarding the implementation of appropriate technical and organisational measures. Where applicable, we maintain written agreements with such processors that meet the requirements of Article 28 of the UK GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">7. Data Security and Protection Measures</h2>
            <p className="mb-4 leading-relaxed">
              We implement and maintain appropriate technical and organisational measures designed to ensure a level of security appropriate to the risk of processing, taking into account the state of the art, implementation costs, and the nature, scope, context, and purposes of processing. These measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Pseudonymisation and encryption of personal data where appropriate;</li>
              <li>Ongoing confidentiality, integrity, availability, and resilience of processing systems;</li>
              <li>Regular testing, assessing, and evaluating the effectiveness of security measures;</li>
              <li>Access controls and authentication procedures for personnel handling personal data;</li>
              <li>Incident response and breach notification procedures.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">8. Data Subject Contact and Enquiries</h2>
            <p className="mb-4 leading-relaxed">
              Any enquiries regarding this Policy, our data processing activities, or requests relating to personal data should be directed to our designated data protection contact:
            </p>
            <p className="mb-4 leading-relaxed">
              <strong>Email:</strong> Daud@dyps.uk
            </p>
            <p className="mb-4 leading-relaxed">
              We endeavour to respond to all data protection enquiries within the timeframes prescribed by applicable legislation, typically within thirty (30) calendar days of receipt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">9. Regulatory Oversight and Complaints</h2>
            <p className="mb-4 leading-relaxed">
              Data subjects who believe that our processing of their personal data does not comply with applicable data protection legislation have the right to lodge a complaint with the Information Commissioner's Office, the UK's supervisory authority for data protection matters.
            </p>
            <p className="mb-4 leading-relaxed">
              <strong>Information Commissioner's Office</strong><br />
              <strong>Website:</strong> ico.org.uk<br />
              <strong>Telephone:</strong> 0303 123 1113<br />
              <strong>Postal Address:</strong> Information Commissioner's Office, Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">10. Policy Amendments and Updates</h2>
            <p className="mb-4 leading-relaxed">
              This Policy may be updated from time to time to reflect changes in our processing activities, legal requirements, or operational procedures. Any material changes will be communicated through publication of a revised version on our website, with the effective date clearly indicated. Continued use of our services following such updates shall constitute acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">11. Interpretation and Governing Law</h2>
            <p className="mb-4 leading-relaxed">
              This Policy shall be interpreted in accordance with the laws of England and Wales. Any disputes arising in connection with this Policy or our data processing activities shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <hr className="my-8 border-border" />
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Document Version:</strong> 1.0</p>
            <p><strong>Effective Date:</strong> 9 September 2025</p>
            <p><strong>Next Review Date:</strong> 9 September 2026</p>
          </div>

          {/* Back to Home Link */}
          <div className="mt-12 pt-8 border-t border-border">
            <Link 
              href="/" 
              className="inline-flex items-center text-amber-900 hover:text-amber-800 transition-colors"
              data-testid="link-back-home"
            >
              ← Back to Application
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}