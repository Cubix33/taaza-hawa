# Idea Research Dossier (Oct 4, 2026)

Method: `WINNER_PLAYBOOK.md` §3. Search for the *friction* (audits, court orders, PILs, complaint data, jurisdiction gaps, maintenance failures), then test each moment against the 6-point winner filter.

Filter: **P** person+hour+place · **E** on-camera event · **L** closed loop with human ack · **D** deterministic truth source (AI not the judge) · **A** every AWS service has a reason · **X** demo-able by a small team in 4 days.

---

## C1. Classroom Air Captain (Air track)
**Moment:** A Class-VI teacher at 8:10 am in a Delhi government school during GRAP. Windows shut → CO₂ climbs past 1,000 ppm and chalk dust accumulates. Windows open → outdoor PM2.5 of 300+ comes in. Is PE outside allowed today? Nobody tells them.
**Evidence**
- An IIT-Delhi / SIE study (Oct 2019–Jan 2020) found classroom PM2.5, PM10 and CO₂ at **12–15× WHO limits**. The main causes were chalk/duster and poor ventilation. In winter windows stay closed (no heating), so CO₂ exceeds limits *and* outdoor PM (>100 µg/m³) infiltrates anyway. (theswaddle / IIT-D repository)
- CO₂ above 1,000 ppm signals insufficient ventilation and impairs concentration.
- GRAP III/IV moves Classes ≤V online and VI–XI to hybrid. Closures have lasted up to 15 days (CEEW).
- **CAQM found schools continuing outdoor sports despite instructions.** The SC said it was "putting students in a gas chamber" and directed sports to be postponed in Nov–Dec. (Tribune, Gulf News)
**Loop:** classroom sensor (PM2.5 + CO₂) + outdoor station + today's GRAP stage → ONE instruction per period ("ventilate 5 min now" / "windows shut, purifier on" / "PE moves indoors") → teacher taps *done* → system **verifies** the reading improved → principal sees compliance across rooms → parents see "your child's classroom today".
**On-camera:** clap a chalk duster / light an agarbatti beside the sensor → teacher's phone buzzes → ack → the curve drops.
**Risks:** Air is likely the most crowded track. Low-cost PM sensors over-read at high humidity (Delhi winter fog), so RH correction is needed (arXiv 2106.12889, 2207.05140: PMS-A003 is most humidity-robust). Air-quality hardware projects are common at hackathons.

## C2. Dhool ya Dhuaan? Rooftop solar loss diagnosis (Waste & Energy track)
**Moment:** A Delhi homeowner who installed PM Surya Ghar rooftop solar opens the inverter app in November: 25 units/day in March, 14 now. Is it **dust** (clean today and recover ₹), **smog** (cleaning wastes water and money; nothing to do), or a **fault** (the vendor owes free repair for 5 years)?
**Evidence**
- PM Surya Ghar: **50.06 lakh households** by July 2026, installing ~16k/day (Deccan Herald, Swarajya). Delhi launched its own portal on Sept 21, 2026; Centre + Delhi subsidy up to ₹1.56 lakh for 3 kW (Outlook Business).
- **"Nearly 99.99% of consumers stop monitoring their systems after installation"** (industry expert, ETV Bharat, Jul 2026). Empanelled vendors must give **free maintenance for 5 years**, but consumers don't know it or don't use it.
- Haze alone cut silicon PV insolation in Delhi by **11.5% ± 1.5% (2016–17)**, with >$20M/yr revenue loss for Delhi alone (Peters et al., *Energy & Env. Sci.* 2018, arXiv 1804.05249).
- Soiling in Delhi: **0.3–0.6%/day**, and **~25% loss after 3 weeks** uncleaned. A ₹1,000 cleaning can recover ~7 units/day. Dec–Jan has 7–14 consecutive days below 2 units/kW from irradiance alone, which is "not a fault" (Bridgeway Power, 1,300 Delhi sites; Renewable Watch).
- Pollution grime is "far more effective at blocking light than dust, and trickier to remove" (Arab News).
- Research exists on separating soiling from weather in power data: arXiv 2209.09457 (soiling loss from unlabeled PV data), 2011.06320 (low-cost optical soiling detector DUSST, <1.4% error). The **IEC 61724-1 soiling ratio** (soiled vs clean reference cell) is the industry-standard deterministic measure.
**Loop:** expected yield (satellite irradiance + aerosol from Open-Meteo/CAMS) vs actual (inverter reading, or a screenshot of the inverter app) → deterministic signature classifier: *smog* = irradiance itself low; *dust* = gradual decline with recovery after rain/clean; *fault* = step drop / zero string → **dust:** cleaner (house help / AMC vendor) gets a job, posts an after-photo, and the system **verifies the recovery** against expected yield. **Smog:** "don't clean, save X litres." **Fault:** a pre-filled complaint to the empanelled vendor citing the 5-year free-maintenance clause, with escalation if not resolved.
**On-camera:** a mini panel + clean reference cell → dust (talc/soil) on one → "Dhool, not dhuaan: clean now, +₹42/day" → cleaner's phone → wipe → the line recovers.
**Risks:** home inverter APIs are fragmented (mitigation: screenshot ingestion + one demo device). The persona is less "vulnerable" than a child. Energy-track judges may want CO₂ framing (kWh lost = coal burned).

## C3. Night Fire Watch: open biomass burning (Air)
**Evidence:** open-burning complaints on the Green Delhi app rose **73% in winter** (Oct 2024–Jan 2025). Night guards light bonfires for warmth, and the government asked RWAs to give guards heaters. 611 enforcement teams were patrolling at night. Chintan's *Smoke in the City* (May 2026) flags slow response and weak inter-agency coordination.
**Loop:** an RWA gives heaters → guard check-in → a sensor spike at night → guard/RWA called → verify.
**Risks:** you can't stage a fire on camera responsibly. Enforcement-flavoured. Hard to verify outcomes.

## C4. Site Dust Co-pilot: construction compliance (Air)
**Evidence:** DPCC portal makes C&D sites ≥500 m² register, file **fortnightly self-declarations**, and install **low-cost PM2.5/PM10 sensors + video fencing**. Anti-smog guns are mandatory (CAQM Dir. 69). GRAP halts construction, and boards shut sites (HSPCB stopped 62).
**Loop:** a site sensor exceeds the limit → the supervisor gets "run the anti-smog gun at Gate 2" → verify the PM drop → evidence auto-assembled into the fortnightly self-declaration.
**Risks:** the persona is a contractor (less sympathetic). It looks like compliance theatre. Low cliché, but less emotional.

## C5. Ganda Paani: tap-water contamination cluster (Heat & Water)
**Evidence:** DJB got **1,633 contamination complaints in 14 days** (Jan 7–20, 2026). Causes: ageing pipes, leaking house connections, **booster pumps sucking in sewage during non-supply hours**, overflowing drains. The Delhi HC asked: "You want citizens to drink sewage mixed water?" NHRC issued a notice.
**Loop:** household reports (photo/turbidity/TDS) → spatial clustering on the same pipeline → a likely leak segment → one consolidated complaint to DJB with evidence → verification after repair. The booster-pump insight becomes a nudge to households.
**Risks:** sensors on taps are unrealistic at scale, and judging water quality from photos with AI is dubious (the AI-as-judge anti-pattern). Clustering needs many users to demo.

## C6. Segregation truck mixing (Waste)
**Evidence:** residents segregate, then single-compartment trucks mix everything. ~50% of Delhi waste is unsegregated. Residents' scepticism is the main barrier.
**Risks:** high cliché (bin photos + classifier). Hard to show a working loop.

---

## Timeliness check (hack Oct 8–11, Delhi)
- Air: GRAP usually starts mid-October, and the stubble season starts Oct 8. Peak relevance, peak crowd.
- Energy/solar: Delhi's PM Surya Ghar portal is 2 weeks old. Smog season is exactly when owners see output fall.
- Water: contamination is year-round. Heat is off-season.

## Sources
theswaddle.com (IIT-D classroom study) · ceew.in (school disruption) · tribuneindia.com (SC/CAQM outdoor sports) · gulfnews.com · outlookbusiness.com / business-standard.com (DPCC portal) · deccanherald.com, swarajyamag.com (PM Surya Ghar 50 lakh) · etvbharat.com (99.99% stop monitoring) · arxiv.org/abs/1804.05249 (Urban haze & PV) · bridgewaypower.in, renewablewatch.in, arabnews.com (soiling) · arXiv 2209.09457, 2011.06320 (soiling estimation) · arXiv 2106.12889, 2207.05140 (low-cost PM humidity) · chintan-india.org Smoke in the City (May 2026) · thestatesman.com (anti-open-burning) · indiacsr.in, theweek.in, nhrc.nic.in (DJB contamination) · thequint.com, NGT OA 678/2023 (segregation)
