# Council round 4: who is Taaza Hawa for? (9 Oct 2026)

Run with the five-advisor LLM Council method: independent advisors, then anonymized peer review, then a chairman verdict. The verdict is in [02-verdict.md](02-verdict.md).

## What prompted it

Two opinions came up about the audience:

- Office workers won't use it. They commute anyway, sit in AC, and are never deciding whether to go outside.
- The real users are a parent deciding whether a child plays outside, or someone who cycles.

The round-4 verdict for the earlier idea ([../../wayfinder/council/03-verdict.md](../../wayfinder/council/03-verdict.md)) chose the builder himself as the user: a Dwarka resident at 06:30, about to go for a run.

## Facts from the code that shaped the question

- The verdict is one fixed rule for everyone ([backend/src/taaza/aqi.py](../../../backend/src/taaza/aqi.py)): AQI ≤200 (Good/Satisfactory/Moderate) → Go; 201–300 (Poor) → Wait; >300 (Very Poor/Severe) → Stay. It does not depend on who is asking.
- The activity chips (walk, jog, run/sport, child playing) explain how much more air each activity breathes in, using US EPA rates. They never change the verdict ([web/src/lib/i18n.js](../../../web/src/lib/i18n.js), lines 101–106 and 262–269).
- Current hero copy: "tells you whether it's OK to go out, run, or send the kids to play right now." Problem copy: "that number decides whether you go for a run or send your child out to play."

## The question as given to every advisor

**Decision.** Who is the actual target audience for Taaza Hawa? Who should be the primary user of the product and the demo? Who is secondary, and who should be explicitly excluded? What concrete changes to copy, features, defaults and the demo story follow from that, given two days left and a solo builder?

**Context given.** The product summary above. R7 citizen frictions:

- parents of school-age children
- PE teachers and student athletes before a 7 am practice
- morning runners (Noida was 837 at 6:40 am and 200 by noon)
- office workers unsure about WFH mandates
- delivery riders
- construction workers
- hostellers
- the dominant r/delhi theme: people don't trust the official number

Judging criteria: Idea & Impact, Built on AWS, Design & usability, Execution, Demo video. The judges only see a 3-minute recorded video. Submissions open 11 Oct, 08:00 IST.

## Advisor responses

### The Contrarian

**Making parents the primary user breaks the product as built.** The verdict is one fixed rule, and at AQI 190 it says "Yes, go ahead." Right underneath, the "Child playing" chip (i18n.js:267) says the child takes in about 5× the dose of sitting still. So a judge sees the app clear the kids to play while warning about their lungs. CPCB's own Moderate band warns that people with sensitive lungs may feel breathing discomfort, and children are the textbook sensitive group. Parents can't be primary unless the rule changes. Changing the rule two days out means new science claims that can't be defended. Cut "send the kids to play" from `heroWhat` and `probText`.

**The 06:30 runner also has a hole.** R7's own evidence says early morning is the worst hour: Noida was 837 at 6:40 and about 200 by noon. In October and November the runner mostly gets "Stay" or "Wait". "Wait for air to improve", but until when? There is no forecast, so "Wait" answers nothing. At minimum, "Wait" has to point at the 24-hour line and say "check again at noon." Otherwise it's an app that says no every morning.

**Whoever you pick, judges will still call it "another AQI app."** The only part that isn't a commodity is the honest range plus the self-graded track record, and even that can be oversold. It grades the estimate against the same CPCB station that r/delhi distrusts. So it does nothing for "purifier says 500, official says 150." Say "we tell you how old the number is and how sure we are." Don't say "we fix data trust."

**The demo itself could fail on camera.** If every station is fresh while you record, the range never appears. Grading takes hours. Line up a stale station in advance and show a Step Functions execution that already finished, or the AWS story has nothing to show.

**Who it's for:**
- **Primary:** healthy adults deciding when to run, walk or cycle. The fixed rule holds up for them.
- **Secondary:** family members who receive the WhatsApp share.
- **Excluded, by name:** delivery riders and construction workers (telling them "Stay in today" is tone-deaf), office workers in AC, and anyone with asthma, heart or lung disease.

### The First Principles Thinker

You're asking the wrong question. "Runner vs parent vs cyclist" sorts people by what they do, and Taaza Hawa doesn't do anything different for any of them. The verdict is one fixed rule and the activity chips never change it, so the app is the same for all of them. Picking a persona and fitting copy to it is decoration.

So start from the facts. What can this app do that no other AQI app can? It tells you how old the number is. It gives a range when the reading is stale. And it grades itself in public. R7 says the real pain is "I don't trust the number", not "I don't know the AQI". The product is a trust instrument. The user is defined by a moment, not a group of people: **someone with an outdoor plan they can skip, in the next hour, at dawn.** Dawn is when readings are stalest and swing the most (Noida 837 at 6:40, 200 by noon). That is the morning runner or walker deciding for themselves. Keep Harshdip at 06:30.

**Exclude parents as the main user.** A single rule that says "Go" at AQI 190 is wrong for a child. CPCB's own Moderate band warns sensitive groups, and a judge who notices that sinks you. Also exclude office workers, delivery riders and construction workers. None of them has a choice to make, and pretending they do is the kind of dishonesty the app exists to reject.

**Secondary user: the person who receives the WhatsApp share,** for example a parent at home who hears the Polly readout. That gives voice and share a real reason to exist instead of looking like add-ons.

Changes:
- Hero copy: "Every AQI app shows a number. We show how old it is, and check ourselves." Cut "send the kids to play" everywhere.
- Demo, first 20 seconds: 06:30, a rival app shows "AQI 180" with no time on it. Taaza Hawa shows that the same station's reading is 4 hours old, gives the range and says Wait. Tap "Check it", and the Step Functions run grades the guess later.
- Defaults: turn the jog chip on. Change nothing else.
- No new features. Spend the two days on the opening and on making the track-record moment run without a hitch.

### The Expansionist

Everyone is arguing about who goes outside. The bigger play is who decides for other people. A runner deciding for himself affects one pair of lungs. A PE teacher or coach looking at the phone at 6:45 am before a 7 am practice decides for 40 children, then tells 40 families. That multiplier is the most undervalued thing in this brief. The product already has the pieces for it: the WhatsApp share, the child-playing chip, the "Wait" verdict, and the SC/HC orders on outdoor school sports.

**Primary user (demo):** the person who makes the call for a group, such as a coach, a PE teacher or the parent who runs the society WhatsApp group. **Secondary:** the parents who receive that message, and the morning runner (Harshdip can still play himself as a runner who coaches or organises).

**Exclude:** office workers and delivery riders. They can't act on a verdict, so including them makes the story vaguer.

The second undervalued thing is the self-grading track record. It answers r/delhi's main complaint directly ("smog outside but AQI shows 280?"). No other AQI app scores its own range against the next real reading. That, not the verdict, is what stops judges filing this as "another AQI app".

**Concrete changes, all small:**
- **Share text becomes a group message:** "7 am practice: WAIT. RK Puram AQI probably 232–264, 40 min old. This app's ranges hit 83% of the time (target 80%)." The trust travels with the share, and every forward reaches a new person.
- **Rename the chip** "child playing" to "school sports / practice".
- **Hero copy:** "Before you send a team onto the field, one look."
- **Demo opening (20 s):** 6:40 am, the coach opens the app and gets "Wait". She taps "Check it and tell me" (Step Functions), shares the verdict to the parents' group, and later the graded "Right" comes back.

"Wait" is the strongest verdict to demo because it moves practice later instead of cancelling it. Go and Stay are things people already guess for themselves.

### The Outsider

I'm reading this cold, the way a judge watching a 3-minute video would. Here's what confuses me.

1. **The copy promises something the product doesn't do.** The hero says "go out, run, or send the kids to play," so I expect an answer for each. There isn't one: it's one rule and the same answer for everyone. The activity chips make it worse. I tap "child playing", read that the child breathes much more air,\* and the verdict still says Go. To me that looks like a bug. The audience is whoever can choose *when* to go outside: the morning runner or walker. Make them primary and cut "kids" from the hero. Parents become secondary as the *receivers* of the WhatsApp share. Keep delivery riders, construction workers and office commuters off screen, because they can't act on a Go/Stay answer.
2. **"Wait" goes nowhere.** Wait until when? Your own research has the answer: 837 at 6:40 am, 200 by noon. A runner needs "check again around 11." Even "next reading at 08:00, tap to get it" is enough. If I could make only one change, it would be this.
3. **The jargon hides the best feature.** "Check it and tell me" means nothing to me, and "split-conformal" means even less. The track record is the only thing that answers r/delhi's real complaint: "I don't trust the number." Rename the button to "Hold me to this" or "Was I right? Check in 2 hours." Show the hit rate on the home screen instead of burying it.
4. **AQI 190 → "Go" will look wrong.** Judges used to the US scale will flinch. Put "Indian AQI (CPCB)" next to the number every time.
5. **Judges don't know Harshdip.** The opening 20 seconds should go: "6:30 am, Dwarka, I want to run. The app says 280. The sky looks worse. Who do I believe?" Then the verdict, then the honest range, then the grade later in the day. That's one person, one question, and proof the app was right.

\* The Outsider originally wrote "2x more air". The chip actually says ~5× (i18n.js:267). The wording was corrected before peer review.

### The Executor

**Primary user: the morning runner.** Specifically Harshdip in Dwarka at 06:30, the story the earlier council already picked. My test is whether you can film it tomorrow morning without faking anything. You live it, you own the phone and you know the street. A parent needs a child and a school morning you can't arrange. A cyclist needs a commute route and a camera rig. A delivery rider can't act on "Stay in". The runner wins on that test alone.

**Secondary: the parent.** The "Child playing" chip already exists and the hero copy already says "send the kids to play". Give it one line in the voiceover, not a shot.

**Excluded:** office workers, delivery riders, construction workers and hostellers. The fixed verdict changes nothing they do, and adding personal thresholds would break the graded track record, the one feature nobody else has.

What sets it apart is trust, not the persona. Judges will give it a second look because every number shows its age, a stale reading becomes an honest range, and AWS later grades that range as right or wrong. Open the demo on the r/delhi complaint "smog outside but AQI shows 280?", not on a picture of a jogger.

What to do, in order:
1. **Tonight, 20 minutes, `web/src/lib/i18n.js`.** Rewrite `probText` in Hindi and English so it opens with the trust complaint. Cut `heroWhat` down to "before your morning run, or before the kids go out". Leave `finalTitle` alone; it already fits.
2. **Tonight.** Write a shot list with timecodes: the complaint, the phone at 06:30, the age stamp, the range, the "Check it and tell me" tap, the Step Functions console, the graded result, the public track record.
3. **10 Oct, 06:15.** Shoot it for real. Before you go out, check that some station's reading is more than 3 hours old so the range appears. If none is, film the track record and an older graded run instead. Don't stage a stale reading.
4. **11 Oct morning.** Second take. Edit, record the voiceover, submit.

No new features. Every hour goes into the video.

## Anonymization used for peer review

A = Executor · B = Contrarian · C = Outsider · D = Expansionist · E = First Principles
