import Image from 'next/image'

// TODO MVP of a landing page
export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-[#eeeeee] to-[#888888]">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <h1 className="text-8xl font-bold text-[#17ae8e]">Apogee</h1>
        <Image
          className="dark:invert"
          src="/orbitant_logo.png"
          alt="Apogee logo"
          width={180}
          height={38}
          priority
        />
        <div className="text-xs sm:text-base text-center font-[family-name:var(--font-geist-mono)] max-w-prose mt-2">
          <p className="mb-8 text-bold italic text-[#17ae8e] bg-gray-800 p-1 rounded-md">
            Orbit Higher Together, One Meter at a Time.
          </p>
          <strong>Apogee</strong>, the ultimate karma bot for Orbiters. Designed
          to boost teamwork and reward positive contributions, Apogee lets users
          award and earn <i>Orbitantmeters</i> — the unique currency for
          tracking growth and progress. Recognize achievements, encourage
          collaboration, and foster a positive culture in your Slack workspace
          with simple commands like{' '}
          <code className="bg-gray-800 p-1 rounded-md text-[#17ae8e]">
            @user&nbsp;++
          </code>{' '}
          to add or subtract meters, highlighting each contribution on the
          team’s journey.
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <Image
          className="dark:invert"
          src="/orbitant_logo_text.png"
          alt="Orbitant logo"
          width={180}
          height={38}
          priority
        />
      </footer>
    </div>
  )
}
