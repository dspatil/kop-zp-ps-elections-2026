'use client';

import styles from '../page.module.css';

export default function PricingPage() {
  return (
    <div className={styles.pricingPageWrapper}>
      <header className={styles.pricingPageHeader}>
        <a href="/" className={styles.pricingBackLink}>← Back to Home</a>
        <h1>💰 Voter Data Packages</h1>
        <p>मतदार डेटा पॅकेजेस</p>
      </header>

      <div className={styles.pricingSection}>
        <div className={styles.pricingSectionTitle}>
          <h2>Get complete voter data for your campaign at affordable prices</h2>
          <p className={styles.pricingSubtitle}>
            संपूर्ण मतदार माहिती आपल्या निवडणूक प्रचारासाठी परवडणाऱ्या किमतीत मिळवा
          </p>
        </div>

        <div className={styles.pricingCards}>
          {/* Village Pack */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingCardHeader}>
              <div className={styles.pricingCardIcon}>🏘️</div>
              <h3 className={styles.pricingCardName}>Village Pack</h3>
              <div className={styles.pricingCardNameMr}>गाव पॅकेज</div>
            </div>
            <div className={styles.pricingCardPrice}>
              <span className={styles.pricingCardCurrency}>₹</span>
              <span className={styles.pricingCardAmount}>999</span>
              <div className={styles.pricingCardPer}>per village / प्रति गाव</div>
              <div className={styles.pricingCardPerVoter}>~1,200 voters avg</div>
            </div>
            <ul className={styles.pricingCardFeatures}>
              <li>Complete voter list with names</li>
              <li>Age & Gender data</li>
              <li>Serial numbers</li>
              <li>Export to CSV/Excel</li>
              <li>Analytics dashboard</li>
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <a 
                href="https://wa.me/919021284186?text=Hi%2C%0A%0AI'm interested in the Village Pack.%0A%0AVillage(s): %0ADivision: %0AContact Number: "
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.pricingCardCta} ${styles.pricingCardCtaSecondary}`}
                style={{ background: '#25D366' }}
              >
                📱 WhatsApp Inquiry
              </a>
              <a 
                href="mailto:inbox.dpatil@gmail.com?subject=Village Pack Inquiry&body=Hi,%0D%0A%0D%0AI am interested in the Village Pack.%0D%0A%0D%0AVillage(s): %0D%0ADivision: %0D%0AContact Number: "
                className={`${styles.pricingCardCta} ${styles.pricingCardCtaSecondary}`}
              >
                ✉️ Email Inquiry
              </a>
            </div>
          </div>

          {/* Ward Pack - Popular */}
          <div className={`${styles.pricingCard} ${styles.pricingCardPopular}`}>
            <div className={styles.pricingCardHeader}>
              <div className={styles.pricingCardIcon}>📋</div>
              <h3 className={styles.pricingCardName}>Ward Pack</h3>
              <div className={styles.pricingCardNameMr}>गण पॅकेज</div>
            </div>
            <div className={styles.pricingCardPrice}>
              <span className={styles.pricingCardCurrency}>₹</span>
              <span className={styles.pricingCardAmount}>2,499</span>
              <div className={styles.pricingCardPer}>per ward / प्रति गण</div>
              <div className={styles.pricingCardPerVoter}>~17,000 voters avg</div>
            </div>
            <ul className={styles.pricingCardFeatures}>
              <li>All villages in ward (3-5 villages)</li>
              <li>Complete voter list with names</li>
              <li>Age, Gender & Surname analysis</li>
              <li>First-time voter lists</li>
              <li>Senior citizen lists</li>
              <li>Export to CSV/Excel</li>
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <a 
                href="https://wa.me/919021284186?text=Hi%2C%0A%0AI'm interested in the Ward Pack.%0A%0AWard/Gan: %0ADivision: %0AContact Number: "
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.pricingCardCta} ${styles.pricingCardCtaPrimary}`}
                style={{ background: '#25D366' }}
              >
                📱 WhatsApp Inquiry
              </a>
              <a 
                href="mailto:inbox.dpatil@gmail.com?subject=Ward Pack Inquiry&body=Hi,%0D%0A%0D%0AI am interested in the Ward Pack.%0D%0A%0D%0AWard/Gan: %0D%0ADivision: %0D%0AContact Number: "
                className={`${styles.pricingCardCta} ${styles.pricingCardCtaPrimary}`}
              >
                ✉️ Email Inquiry
              </a>
            </div>
          </div>

          {/* Division Pack */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingCardHeader}>
              <div className={styles.pricingCardIcon}>🎯</div>
              <h3 className={styles.pricingCardName}>Division Pack</h3>
              <div className={styles.pricingCardNameMr}>विभाग पॅकेज</div>
            </div>
            <div className={styles.pricingCardPrice}>
              <span className={styles.pricingCardCurrency}>₹</span>
              <span className={styles.pricingCardAmount}>4,999</span>
              <div className={styles.pricingCardPer}>per division / प्रति विभाग</div>
              <div className={styles.pricingCardPerVoter}>~34,000 voters avg</div>
            </div>
            <ul className={styles.pricingCardFeatures}>
              <li>Full ZP division (2 wards included)</li>
              <li>All villages in division</li>
              <li>Complete voter demographics</li>
              <li>Surname-wise community analysis</li>
              <li>Age group targeting lists</li>
              <li>Priority support</li>
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <a 
                href="https://wa.me/919021284186?text=Hi%2C%0A%0AI'm interested in the Division Pack.%0A%0ADivision Number: %0AContact Number: "
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.pricingCardCta} ${styles.pricingCardCtaSecondary}`}
                style={{ background: '#25D366' }}
              >
                📱 WhatsApp Inquiry
              </a>
              <a 
                href="mailto:inbox.dpatil@gmail.com?subject=Division Pack Inquiry&body=Hi,%0D%0A%0D%0AI am interested in the Division Pack.%0D%0A%0D%0ADivision Number: %0D%0AContact Number: "
                className={`${styles.pricingCardCta} ${styles.pricingCardCtaSecondary}`}
              >
                ✉️ Email Inquiry
              </a>
            </div>
          </div>

          {/* Taluka Pack */}
          <div className={`${styles.pricingCard} ${styles.pricingCardPremium}`}>
            <div className={styles.pricingCardHeader}>
              <div className={styles.pricingCardIcon}>🏆</div>
              <h3 className={styles.pricingCardName}>Taluka Pack</h3>
              <div className={styles.pricingCardNameMr}>तालुका पॅकेज</div>
            </div>
            <div className={styles.pricingCardPrice}>
              <span className={styles.pricingCardCurrency}>₹</span>
              <span className={styles.pricingCardAmount}>4,000</span>
              <div className={styles.pricingCardPer}>per division / प्रति विभाग</div>
              <div className={styles.pricingCardPerVoter}>Bulk discount!</div>
            </div>
            <ul className={styles.pricingCardFeatures}>
              <li>All divisions in taluka</li>
              <li>₹1,000 savings per division</li>
              <li>Complete taluka coverage</li>
              <li>Custom reports & analysis</li>
              <li>Priority WhatsApp support</li>
              <li>Free updates during election</li>
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <a 
                href="https://wa.me/919021284186?text=Hi%2C%0A%0AI'm interested in the Taluka Pack.%0A%0ATaluka Name: %0AContact Number: "
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.pricingCardCta} ${styles.pricingCardCtaPrimary}`}
                style={{ background: '#25D366' }}
              >
                📱 WhatsApp Inquiry
              </a>
              <a 
                href="mailto:inbox.dpatil@gmail.com?subject=Taluka Pack Inquiry&body=Hi,%0D%0A%0D%0AI am interested in the Taluka Pack.%0D%0A%0D%0ATaluka Name: %0D%0AContact Number: "
                className={`${styles.pricingCardCta} ${styles.pricingCardCtaPrimary}`}
              >
                ✉️ Email Inquiry
              </a>
            </div>
          </div>
        </div>

        {/* Taluka Examples */}
        <div className={styles.talukaExamples}>
          <h3>📊 Taluka Pack Examples / तालुका पॅकेज उदाहरणे</h3>
          <div className={styles.talukaTable}>
            <div className={styles.talukaTableHeader}>
              <span>Taluka / तालुका</span>
              <span>Divisions / विभाग</span>
              <span>Price / किंमत</span>
            </div>
            <div className={styles.talukaTableRow}>
              <span>Ajara / आजरा</span>
              <span>2</span>
              <span>₹8,000</span>
            </div>
            <div className={styles.talukaTableRow}>
              <span>Chandgad / चंदगड</span>
              <span>4</span>
              <span>₹16,000</span>
            </div>
            <div className={styles.talukaTableRow}>
              <span>Gadhinglaj / गडहिंग्लज</span>
              <span>5</span>
              <span>₹20,000</span>
            </div>
            <div className={styles.talukaTableRow}>
              <span>Kagal / कागल</span>
              <span>7</span>
              <span>₹28,000</span>
            </div>
            <div className={styles.talukaTableRow}>
              <span>Hatkanangale / हातकणंगले</span>
              <span>11</span>
              <span>₹44,000</span>
            </div>
          </div>
          <p className={styles.talukaNote}>
            * All 12 talukas available. Contact for other talukas. / सर्व १२ तालुके उपलब्ध. इतर तालुक्यांसाठी संपर्क करा.
          </p>
        </div>

        {/* Contact Section */}
        <div className={styles.pricingContact}>
          <h3>🤝 Need Custom Package? / कस्टम पॅकेज हवे?</h3>
          <p>Contact us for bulk deals, multiple talukas, or special requirements</p>
          <div className={styles.pricingContactButtons}>
            <a 
              href="https://wa.me/919021284186?text=Hi%2C%20I%27d%20like%20to%20inquire%20about%20custom%20packages%20for%20Kolhapur%20Elections"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.pricingWhatsApp}
            >
              📱 WhatsApp
            </a>
            <a 
              href="mailto:inbox.dpatil@gmail.com?subject=Custom Package Inquiry - Kolhapur Elections"
              className={styles.pricingEmail}
            >
              ✉️ Email Us
            </a>
          </div>
        </div>

        {/* Trust Note */}
        <div className={styles.pricingNote}>
          <p>
            🔒 <strong>Data Privacy:</strong> All data is from official voter lists. 
            Used only for legitimate election campaigns. / 
            सर्व डेटा अधिकृत मतदार यादीतून. फक्त निवडणूक प्रचारासाठी वापर.
          </p>
        </div>

        {/* Footer */}
        <div className={styles.pricingFooter}>
          <p>© 2026 dspatil. All rights reserved.</p>
          <p>Made with ❤️ for Kolhapur 🇮🇳</p>
        </div>
      </div>
    </div>
  );
}
