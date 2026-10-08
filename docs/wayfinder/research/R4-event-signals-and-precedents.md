# R4 — Event signals and precedents: Environmental Hacks (Bharat Builds Tour, Event 02)

Researched 2026-10-04. VERIFIED = read from the source page. REPORTED = search snippets or second-hand only.

## Executive summary

1. Judging is five unweighted criteria: Idea and Impact, Built on AWS, Design and usability, The execution, The demo video. No points are published; the 10/8/4/4/4 rubric we believed in is NOT confirmed (VERIFIED absence on all official pages).
2. The one hard gate: "either use at least one AWS open source tool or be deployed on AWS." Either is enough; the video must show it.
3. Submission = public repo (history inside Oct 8-11) + YouTube video under 3 minutes + short writeup ("the problem, the build, and where AWS fits"). No live demo, no call.
4. Deadline hour not published yet ("The hours are being finalised"). Precedent: First Commit closed Sunday 8:00 PM IST.
5. Tracks are themes: Air / Heat and Water / Waste and Energy, each ₹2,00,000 + $2,000 credits; 4 runners-up $1,000 credits; top 5 Builder Center blogs win AirPods 5.
6. "Each track is judged on its own" and "A small problem solved well beats a big one solved vaguely" should steer idea choice.
7. Mentors are 12 AWS India staff (cloud support, DB, TAMs, one AI/ML consultant); DTU day Oct 10 has a Strands Agents workshop and "adds nothing to your score".
8. First Commit winners were agentic, consumer-shaped products with a live URL: Suraksha (elder-care agent, Cedar + Bedrock + Step Functions) won Ship It; Beacon Night Shift (solo, voice on-call agent, Strands + Nova 2) won Build It; CampusEvac (two-player fire-drill game) won Best UI.
9. No tour stop ran between Stop 01 and Environmental Hacks; stops 03-06 "announcing soon".
10. Fast-track Amazon interviews are decoupled from prizes and limited to pre-final/final-year students.

## 1. Official event page (VERIFIED, https://www.wemakedevs.org/aws/env + /schedule, /mentors, /rules)

**Format.** "Teams of 1 to 4", online "Anywhere in India"; in person Oct 10, 8 AM-8 PM, DTU. Hero: "It can be a problem in your city, your college or your home."

**Schedule tab (VERIFIED, /aws/env/schedule).** Thu Oct 8: "The clock starts ... Teams form, tracks get picked, repos get made." Fri Oct 9: build on Discord. Sat Oct 10: "The build day, 8 AM to 8 PM". Sun Oct 11: "Last day to submit your project online, demo video included". "The hours are being finalised: the kickoff call, the sessions, and the deadline the clock stops on. They land on this page first, and everyone checked in is told the same day." Press "Check in" to get that notice; no other mandatory check-ins. Precedent (REPORTED, luma.com/first-commit): "submissions remain open until Sunday 8:00 PM IST".

**Mentors tab (VERIFIED, /aws/env/mentors).** "The AWS team mentoring Environmental Hacks: cloud, database and support engineers, account managers and consultants." 12 AWS India staff: Komal Tayal, Aman Gupta, Kushal Gupta (Cloud Support), Shubhra Singh, Shweta Chopra (Database), Anant Jain, Kartik Koul, Soumya Gupta (TAMs), Nitin Singla, Kritika Bakshi, Sukirti Gupta (Cloud Eng), Chanpreet Singh (Sr Lead Consultant AI/ML). Signal: operational AWS people, not climate scientists; they notice architecture, service choice and cost. DTU speakers: Kunal Kushwaha, Piyush Garg, Saiyam Pathak. Judges not yet listed.

**Rules tab (VERIFIED, /aws/env/rules and tour rules /aws/rules).**
- Eligibility: "university student in India and you are 18 or older"; verified student profile on AWS Builder Center ("Required to compete").
- Teams: "Build alone, or in a team of up to four people." "One submission per team. One team per person per hackathon."
- Pre-work: "Old projects do not count. Build something new once the clock starts." "Learn and practise as much as you want. Project work starts when the clock does." Allowed: "open-source libraries, frameworks, public APIs, boilerplate and starter templates", with attribution. AI tools must be listed in the writeup.
- AWS: "Your project has to use AWS, and your demo video has to show it. Naming AWS in the writeup alone is not enough."
- Artefacts: "a public repository, a demo video of up to three minutes, and a short writeup covering the problem, the build, and where AWS fits." Video on YouTube (public or unlisted). Repo history must match event dates. "Submit on your hackathon's own submission form, once per team, before the deadline." "Deadlines are strict."
- Judging: "Judges score what you submit and nothing else. There is no live demo and no call." "Scores are not published." Disqualification for copying, old work, or mismatched repo history.
- Fast-track: up to 10 per hackathon, Pre-Final (2027) and Final Year (2026) only; "Winning a track ... does not qualify a project for a fast-track interview."
- Form fields (REPORTED, First Commit team's video-script PR, github.com/thegoodengineers/leash/pull/82): "About the project / Tech stack and architecture / How you used AWS / Learning and growth". Unconfirmed for this event.

**Prizes (VERIFIED).** Three track winners ₹2,00,000 + $2,000 credits each; 4 runners-up $1,000 credits ("every submission is already in the running"); "Top 5 blogs — AirPods 5: Write up what you built: the problem, the stack, what fought back. Publish it on AWS Builder Center and link it in your submission." Swag to top teams. Fast-track: "6 months Internship, plus full-time roles."

**Judging section (VERIFIED, verbatim).** Intro: "projects that make a real difference to the air people breathe, the water they depend on, and the waste and energy their cities run on."
01 Idea and Impact: "Does it fix a real environmental problem? And what changes for the people living with it? A small problem solved well beats a big one solved vaguely."
02 Built on AWS: "Using an AWS open-source project or AWS services is mandatory to win a prize."
03 Design and usability: "The people living with the problem have to be able to use the fix: clear to pick up, easy to get around, and built for where they are. Would someone who isn't on your team know what to do with it?"
04 The execution: "Does it work? Not perfect, not polished. Working. One feature that runs beats five that almost do."
05 The demo video: "Three minutes, recorded, to show what it does, who it is for, and where AWS fits. There is no live demo, so the video is what the judges see."
Footer: "We judge what you built, not what you spent ... each track is judged on its own."

**FAQ (VERIFIED).** "Do I have to pick a track? Yes ... Each track has its own winner." "Build It and Ship It ... are not tracks this time. They're the two ways to build." In person "doesn't add to your score." Certificate for everyone who submits. "The problems under each track are a place to start, not a list to pick from. If it makes the air cleaner, the water safer or the city lighter, it fits." Seed lists: Air: AQI, Pollution exposure, Stubble burning, Indoor air, School safety on bad days. Heat and Water: Heatwaves, Floods, Monsoon waterlogging, Droughts, Water tankers, Leaks, Groundwater. Waste and Energy: Segregation, Recycling, E-waste, Informal recyclers, Rooftop solar, EV nudges, Public transport.

## 2. Stop 01 "First Commit" recap and rubric

**Rubric (VERIFIED).** First Commit's overview and judges pages list the same five criteria with no numbers. The 10/8/4/4/4 weighting is UNCONFIRMED anywhere (wemakedevs.org, Internshala, Luma, participant repos). One team's demo script tags shots "idea, AWS, learning, execution, video" (github.com/Chirag6722/leash/pull/71): "learning" was a form section, not a weight.

**Judges (VERIFIED, /aws/first-commit/judges).** 27, e.g. Zameer Fouzan (New Relic), Shivay Lamba (Qualcomm), Aditya Oberai (Appwrite), Hannah Kwon and Manisha Choudhary (Amazon), Saurav Mittal (Apple). Mostly DevRel and senior engineers: clear demos and clean repos over domain depth.

**Winners (VERIFIED, https://www.wemakedevs.org/aws/first-commit/projects).**
- 1st Ship It (₹2L + $3k): Suraksha, "An Agentic Companion for an aging parent" (3 people). Voice-first; Bedrock Nova 2 Lite, Transcribe, Polly, Lambda, DynamoDB, Step Functions, EventBridge, Cognito, Amplify, Cedar "ConsentGuard". README: "Most days, Suraksha says nothing at all. That's the point." Includes architecture diagram and build-story doc.
- 2nd Build It (₹1.5L + $2k): Beacon Night Shift, solo, voice on-call agent; Strands, Nova 2, Step Functions, Transcribe/Polly; tagged release, video and blog.
- 3rd Best UI (₹1L + $1k): CampusEvac, two-player browser fire-evacuation drill; AppSync Events, DynamoDB, Polly, SES.
- Runners-up ($1k credits): Magpie (AI finance), FreshTrace (IoT food-spoilage, the only environment-adjacent winner), Expressive captions, Factcade (factory ops copilot).
- Blog winners (VERIFIED, /aws/first-commit/projects/blogs): Slate, KavachPay, Career Agent, VaporTrace, Clusterbreak; "wrote about what they built and what the weekend taught them."
- Recap post (REPORTED): "First Commit Hackathon Recap and What's Next" by Kunal Kushwaha on Builder Center, "16,000+ participants". Could not open. No judges' comments found.

## 3. Other stops between Stop 01 and Environmental Hacks

None (VERIFIED, wemakedevs.org/aws): Event 01 completed, Event 02 upcoming, Events 03-06 "Announcing soon", tour runs Sept-Dec 2026.

## 4. AWS Builder Center signals

- WeMakeDevs guide "The Only Resource You Need for Bharat Builds" (VERIFIED, wemakedevs.org/blogs/the-only-resource-you-need-for-bharat-builds): "a write-up reads far better than a repository with three commits and no README"; a blog should explain "what you built, which service did what, what broke and what you would do differently". Ship It means "something running on AWS with a URL a judge can open".
- Blog prize brief (VERIFIED, event page): "the problem, the stack, what fought back", on Builder Center, linked in the submission.
- Participant posts in the space (REPORTED): LUMI, Z-heal, PharmaStock, Nourish; build-notes style.

## 5. WeMakeDevs / Kunal Kushwaha public posts (Sept-Oct 2026)

- Tour announcement (REPORTED, x.com/kunalstwt/status/2094281614272725395): "Prizes worth ₹1 crore"; Piyush Garg (x.com/piyushgarg_dev/status/2105235996040392815) confirms DTU Oct 10.
- Luma DTU agenda (VERIFIED, luma.com/env): 8:00 check-in; 9:30 opening; 10:00 panel; 11:00-12:30 "Strands Agents hands-on workshop"; build until 19:00; 19:00-20:00 showcase and feedback. Approval required.
- No posts found with example ideas or "what we want to see"; Kunal's October posts promote Graph Hacks instead.

## 6. Past winners in environment/civic tech (to avoid repeating)

- FreshTrace (First Commit runner-up): IoT cold-chain spoilage prediction.
- Infrastructure Signal (Scrape-Verse, Aug 2026): flags work hit by published power outages.
- First Commit entrants: TruckView (route risk with weather), PRAAPTI AI (welfare schemes/RTI). None of the top 7 were AQI/water/waste tools; the space is open, but expect many generic AQI dashboards.

## 7. AWS open-source tools list (VERIFIED on event page)

"To be eligible for prizes, your project needs to either use at least one AWS open source tool or be deployed on AWS." Build It column: Strands Agents SDK, PartyRock, Finch, EKS Distro, EKS Anywhere, SAM CLI, LocalStack, Firecracker, Corretto, OpenSearch, Cedar. Ship It column: SageMaker AI, EKS/ECS/Fargate, Lambda/API Gateway/Step Functions, EC2/Lightsail/App Runner/Amplify, S3/DynamoDB/RDS/Aurora, Cognito, CloudFront/Route 53/EventBridge/SQS/SNS/CloudWatch. "Just a starting point ... not a set of rules." Deployed-on-AWS alone is sufficient; an open-source tool alone (Cedar or Strands locally) is also sufficient. LocalStack is listed despite not being AWS-owned.

## Implications for idea choice

- Optimise for "small problem solved well" with a named user who "isn't on your team"; the usability criterion is about the affected person, not the judge.
- Pick one track and sit squarely in it; "each track is judged on its own".
- Weights unknown, so assume equal: one working feature + tight 3-minute video + visible AWS beats breadth.
- Previous winners were agentic, voice/Bedrock-heavy, consumer-grade UIs with a live URL; a solo builder won Build It. A live URL in the video is the norm even though "local counts".
- Cedar and Strands both appeared in the Ship It winner; an AWS open-source tool on top of deployment covers the AWS criterion twice.
- Judges are likely DevRel/engineers plus AWS mentors: include an architecture diagram, a cost line, and "what broke"; that also feeds the blog prize.
- Avoid the generic AQI dashboard; under-served seeds: "School safety on bad days", "Water tankers", "Informal recyclers", "Stubble burning".
- Repo created after kickoff Oct 8; deadline probably Sun Oct 11, 8 PM IST (unconfirmed); check in and watch Discord.
- Map the writeup to the likely form fields: about, stack/architecture, how AWS was used, learning and growth.
