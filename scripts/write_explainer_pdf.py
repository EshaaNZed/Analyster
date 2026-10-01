"""Plain-language explainer of the Analyster pipeline, written as a PDF."""
import os

from reportlab.lib.colors import Color, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    ListFlowable,
    ListItem,
    HRFlowable,
)

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, "docs", "How_Analyster_Works.pdf")

NAVY = Color(0.09, 0.12, 0.20)
INDIGO = Color(0.31, 0.27, 0.90)
CREAM = Color(0.97, 0.96, 0.94)
INK = Color(0.12, 0.14, 0.18)
MUTED = Color(0.35, 0.38, 0.45)
AMBER_BG = Color(1.0, 0.96, 0.88)
AMBER = Color(0.55, 0.32, 0.05)
GREEN_BG = Color(0.90, 0.97, 0.93)
GREEN = Color(0.05, 0.40, 0.28)
RED_BG = Color(0.99, 0.93, 0.93)
BLUE_BG = Color(0.93, 0.95, 0.99)


def styles():
    return {
        "cover_kicker": ParagraphStyle(
            "cover_kicker", fontName="Times-Bold", fontSize=11,
            textColor=INDIGO, alignment=TA_CENTER, tracking=1.2,
            spaceAfter=8,
        ),
        "cover_title": ParagraphStyle(
            "cover_title", fontName="Times-Bold", fontSize=32,
            textColor=NAVY, alignment=TA_CENTER, leading=36, spaceAfter=10,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub", fontName="Times-Italic", fontSize=13,
            textColor=MUTED, alignment=TA_CENTER, leading=18, spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "h1", fontName="Times-Bold", fontSize=18, textColor=NAVY,
            leading=22, spaceBefore=4, spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2", fontName="Times-Bold", fontSize=13, textColor=INDIGO,
            leading=16, spaceBefore=10, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body", fontName="Times-Roman", fontSize=11, textColor=INK,
            leading=15.5, spaceAfter=7,
        ),
        "bullet": ParagraphStyle(
            "bullet", fontName="Times-Roman", fontSize=11, textColor=INK,
            leading=15, leftIndent=4,
        ),
        "small": ParagraphStyle(
            "small", fontName="Times-Italic", fontSize=9, textColor=MUTED,
            leading=12, spaceBefore=2, spaceAfter=6,
        ),
        "formula": ParagraphStyle(
            "formula", fontName="Courier-Bold", fontSize=9.5, textColor=NAVY,
            leading=13, alignment=TA_CENTER,
        ),
        "th": ParagraphStyle(
            "th", fontName="Times-Bold", fontSize=9, textColor=white, leading=12,
        ),
        "td": ParagraphStyle(
            "td", fontName="Times-Roman", fontSize=9, textColor=INK, leading=12,
        ),
        "td_b": ParagraphStyle(
            "td_b", fontName="Times-Bold", fontSize=9, textColor=INK, leading=12,
        ),
        "footer": ParagraphStyle(
            "footer", fontName="Times-Roman", fontSize=8, textColor=MUTED,
        ),
    }


S = styles()


def h1(text):
    return Paragraph(text, S["h1"])


def h2(text):
    return Paragraph(text, S["h2"])


def p(text):
    return Paragraph(text, S["body"])


def note(text):
    return Paragraph(text, S["small"])


def callout(text, bg=BLUE_BG, border=INDIGO):
    inner = Paragraph(text, S["body"])
    box = Table([[inner]], colWidths=[170 * mm])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 1.2, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return box


def bullets(items):
    flow = []
    for item in items:
        flow.append(ListItem(Paragraph(item, S["bullet"]), leftIndent=12, bulletColor=INDIGO))
    return ListFlowable(
        flow, bulletType="bullet", start="circle",
        leftIndent=16, bulletFontName="Times-Roman", bulletFontSize=8,
        spaceBefore=2, spaceAfter=8,
    )


def table(headers, rows, col_widths):
    head = [Paragraph(h, S["th"]) for h in headers]
    body = []
    for row in rows:
        body.append([
            Paragraph(cell, S["td_b"] if i == 0 else S["td"])
            for i, cell in enumerate(row)
        ])
    data = [head] + body
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, CREAM]),
        ("GRID", (0, 0), (-1, -1), 0.3, Color(0.82, 0.84, 0.88)),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    t.setStyle(TableStyle(style))
    return t


def rule():
    return HRFlowable(width="100%", thickness=0.4, color=Color(0.82, 0.84, 0.88), spaceBefore=2, spaceAfter=8)


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, A4[1] - 12 * mm, A4[0], 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Times-Bold", 8)
    canvas.drawString(18 * mm, A4[1] - 7.5 * mm, "ANALYSTER")
    canvas.setFont("Times-Roman", 8)
    canvas.drawRightString(A4[0] - 18 * mm, A4[1] - 7.5 * mm, "How the claims pipeline works")
    canvas.setFillColor(MUTED)
    canvas.setFont("Times-Roman", 8)
    canvas.drawString(18 * mm, 10 * mm, "A plain-language walkthrough. The computer never approves or denies a claim.")
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"{doc.page}")
    canvas.restoreState()


def cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.setFillColor(INDIGO)
    canvas.rect(0, 118 * mm, A4[0], 3, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Times-Bold", 11)
    canvas.drawCentredString(A4[0] / 2, 200 * mm, "A STORY WITH EVERY STEP")
    canvas.setFont("Times-Bold", 30)
    canvas.drawCentredString(A4[0] / 2, 180 * mm, "How Analyster Works")
    canvas.setFont("Times-Italic", 13)
    canvas.setFillColor(Color(0.78, 0.82, 0.90))
    lines = [
        "From made-up accidents, to the nine clues,",
        "to the score on the screen.",
        "",
        "Told in short sentences.",
        "The numbers are the real ones from this project.",
    ]
    y = 158 * mm
    for line in lines:
        canvas.drawCentredString(A4[0] / 2, y, line)
        y -= 7 * mm
    canvas.setFillColor(Color(0.65, 0.70, 0.80))
    canvas.setFont("Times-Roman", 10)
    canvas.drawCentredString(A4[0] / 2, 40 * mm, "Insurance claims intelligence  ·  human still decides")
    canvas.restoreState()


def build():
    story = []
    story.append(Spacer(1, 8 * mm))  # cover is drawn by onFirstPage; this page is blank content
    # We use a real first flowable page after a page break triggered by onFirstPage empty?
    # Better: first page is cover via BaseDocTemplate... SimpleDocTemplate onFirstPage draws cover
    # AND still flows story onto page 1. So story must start with PageBreak after an empty spacer
    # that we don't want. Trick: onFirstPage paints the cover over the whole page, and the first
    # story item is PageBreak so content starts on page 2. A tiny invisible spacer still sits
    # under the cover. That's fine if the cover paints the full page.
    story.append(PageBreak())

    story.append(h1("1. The whole thing in one breath"))
    story.append(p(
        "Someone has a bad day. A car bumps. A kitchen burns. A boat goes missing. "
        "They ask an insurance company for money. That ask is called a claim."
    ))
    story.append(p(
        "Analyster is a helper for the person who checks claims. It reads the file and "
        "puts a sticker on it: <b>Low</b>, <b>Medium</b>, or <b>High</b>. "
        "Low means \"this looks ordinary, go fast.\" High means \"a person should look hard.\""
    ))
    story.append(callout(
        "<b>The computer never says yes or no to the money.</b> "
        "A person still decides. The sticker is a queue, like lining up at school: "
        "some kids go to the front of the line because their story needs a grown-up."
    ))
    story.append(p("The path, in order:"))
    story.append(bullets([
        "<b>Real people.</b> A public list of insurance customers. We did not invent the people.",
        "<b>Made-up accidents.</b> The public list has no claims, so we write 1,500 stories.",
        "<b>A filing cabinet.</b> Customers, policies, and claims go into one database.",
        "<b>Nine clues.</b> We keep behavior clues. We throw away \"how rich\" and \"how big the bill is\" as fraud clues.",
        "<b>A size ruler.</b> How big is this loss compared with other losses on the same kind of policy. This is a ruler, not a learner.",
        "<b>Three learners.</b> One guesses \"does this look like a planted trick.\" One checks that guess. One rings a bell when a claim sits far from the crowd.",
        "<b>A late-note rule.</b> You get 14 days. After that, each extra day adds 1 point, up to 46.",
        "<b>One score, 0 to 100.</b> Then five helpers write a report. A person reads it.",
    ]))

    story.append(h1("2. Where the people come from"))
    story.append(p(
        "The people are from a public research set called <b>COIL 2000</b>. "
        "It is a list of Dutch insurance customers from the year 2000. "
        "About <b>9,822 people</b> and about <b>15,546 policies</b>."
    ))
    story.append(p(
        "A policy is the promise: \"if this kind of bad thing happens, we may pay, up to this limit.\" "
        "The kinds we use are short names the models know: <b>Auto, Fire, Boat, Caravan, Private Accident</b>."
    ))
    story.append(h2("Cleaning the list"))
    story.append(p(
        "The raw list is messy. Column names are codes. Some values are odd. "
        "The cleaner turns codes into words a person can read, and writes a clean customer table. "
        "Then a quality check runs. On the rebuilt book it passed <b>11 out of 11</b> checks."
    ))
    story.append(h2("Giving each policy a birthday"))
    story.append(p(
        "COIL does not give us a useful \"when did this policy start\" for the stories we need. "
        "So the synthesizer gives each policy a start date, spread from the start of 2018 across about 2,300 days. "
        "About <b>12%</b> of policies also get a day when the cover amount went up. "
        "That day matters later: a fire the week after you raised the cover is a different story from a fire on a policy you have had for years."
    ))
    story.append(callout(
        "<b>What we do not turn into suspicion.</b> "
        "Purchasing power (a stand-in for income), household size, and how many policies someone holds "
        "stay on the profile so an adjuster can see them. They are <b>not</b> clues in the score. "
        "Being less rich does not add points. Holding zero policies is allowed on a new form. "
        "Zero policies is a coverage question for a person (\"do they even have a policy?\"), not a fraud point.",
        bg=AMBER_BG, border=AMBER,
    ))

    story.append(h1("3. Writing the 1,500 accidents"))
    story.append(p(
        "The claim writer is <b>claim_factory.py</b>. It uses a fixed random seed, <b>42</b>, "
        "so the same stories come back if we build the book again. "
        "It writes <b>1,500 claims</b>. <b>180 of them (12%)</b> are planted tricks. "
        "The plant flag is an answer key for teaching. It is not what the live score looks at."
    ))
    story.append(h2("The ordinary stories"))
    story.append(p("Most claims are ordinary. They are split on purpose so \"big\" and \"new\" are not the same as \"trick.\""))
    story.append(table(
        ["Bucket", "How many", "What it teaches"],
        [
            ["Hail storm", "28 caravan claims", "Many people, one storm (STORM-2023-08). A crowd can be honest."],
            ["Everyday losses", "about 1,252", "Older policies. The story label is Low, even if the dollars vary. About 6% are real big disasters, 50% to 85% of the limit, labeled Medium, and they are not tricks."],
            ["Young but honest", "40", "The loss is 8 to 70 days after the policy starts. About 15% also had a coverage change. A new policy alone is not proof."],
            ["Planted tricks", "180", "Behavior that should look different: wrong words, slow filing, a linked group, or a fire right after a change."],
        ],
        [32 * mm, 38 * mm, 100 * mm],
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(h2("The planted tricks"))
    story.append(p("Each planted claim is one of three kinds. The mix is 35% blatant, 45% subtle, 20% spike."))
    story.append(bullets([
        "<b>Blatant, 35%.</b> Either a staged car-crash ring, or a boat \"theft\" claimed for the exact policy limit. Crash-ring people share a group id, in groups of three, and they file late (often weeks). The boat story files fast, on purpose, so \"late\" is not the only way to look wrong.",
        "<b>Subtle, 45%.</b> A water-repair bill that is a bit too fat. The dollars overlap honest claims. The label written on the story is Medium. Many of these stay Medium after scoring. That is on purpose: a quiet trick should not always scream High.",
        "<b>Spike, 20%.</b> A fire on a young policy. About half the time the loss is 4 to 21 days after the policy starts. The other half is 30 to 90 days after, and we force a coverage increase just before the fire. They file in 1 to 3 days. The odd part is the timing, not the wait.",
    ]))
    story.append(p(
        "About <b>22%</b> of tricks are written on the wrong kind of policy. "
        "A boat-theft sentence on a fire policy, for example. "
        "That gives the \"the words do not match the policy\" clue something to learn. "
        "If a scheme's home line has no policies left to pick, the writer uses a wider pool. "
        "The boat book is small, so many phantom-theft stories land on other lines. "
        "A boat theft that really is on a boat, for the full limit, is caught by the size ruler (the claim uses 100% of the limit), not by the word-match clue."
    ))
    story.append(h2("Two counts we can only know at the end"))
    story.append(p(
        "After every claim exists, the writer looks backward:"
    ))
    story.append(bullets([
        "<b>Prior claims in 24 months.</b> How many earlier claims this same customer had in the last 730 days.",
        "<b>Linked claims in 90 days.</b> How many other claims share this event group and sit within 90 days. The crash ring is the main place this is not zero. The hail storm shares a group too, so a storm can show links without being a trick.",
    ]))
    story.append(callout(
        "<b>Two labels, do not mix them up.</b> "
        "The word written when the story was invented (Low, Medium, or High) is a scenario label. "
        "The number you see when you open a claim in the studio is computed live. "
        "They can disagree. The live number is the one the adjuster is meant to use.",
        bg=AMBER_BG, border=AMBER,
    ))

    story.append(h1("4. The filing cabinet"))
    story.append(p(
        "Clean customers, policies, and claims are saved in a SQLite database: "
        "<font face='Courier'>data/processed/claims_intelligence.db</font>. "
        "The shape is a star: people in one table, policies in one table, claims in one table, "
        "joined by ids. A view called <b>v_claims_full_dossier</b> is the \"whole folder for one claim,\" "
        "including days since the policy started, the coverage-change flag, prior claims, and linked claims."
    ))
    story.append(p("Two more cabinets sit beside the database. They help the report. They do not set the 0–100 score."))
    story.append(bullets([
        "<b>A story library (Chroma).</b> Each of the 1,500 narratives is turned into a list of numbers by a small language model named all-MiniLM-L6-v2. \"Find me claims that sound like this\" is a nearest-neighbor search in that library.",
        "<b>A relationship map (a NetworkX graph).</b> People, policies, addresses, and brokers become dots and lines. The map is how a helper can say \"these claims share a broker or an address.\"",
    ]))

    story.append(h1("5. The nine clues"))
    story.append(p(
        "Before any learner runs, every claim is turned into the same nine numbers. "
        "Training and the live score use the same function, so they cannot drift apart. "
        "The list lives in <font face='Courier'>triage_features.py</font>."
    ))
    story.append(table(
        ["Clue", "In kid words", "Kind"],
        [
            ["Delay vs this line", "How many days later than the usual wait for this kind of policy. Usual wait is the middle claim on that line.", "Number"],
            ["Days since the policy started", "How old the promise was on the day of the loss. If a new claim does not say, we use 400, meaning \"old policy,\" not \"brand new.\"", "Number"],
            ["Prior claims, 24 months", "How many other claims this person already had in two years.", "Number"],
            ["Linked claims, 90 days", "How many buddy-claims share the event and sit within 90 days.", "Number"],
            ["Words do not match", "The incident words do not belong on this policy. See the word lists below.", "Yes or no"],
            ["Coverage just went up", "The cover amount changed in the 30 days before the loss.", "Yes or no"],
            ["Auto / Fire / Other", "Three yes-or-no switches: is it Auto, is it Fire, or is it something else (Boat, Caravan, Private Accident). This tells the learner the kind of policy. It is not a moral score.", "Yes or no"],
        ],
        [38 * mm, 108 * mm, 24 * mm],
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(h2("When do the words \"not match\"?"))
    story.append(p(
        "Only these exact line names are checked. If the form says something else, like the old phrase \"Auto Insurance,\" "
        "the check is skipped and the claim is treated as \"other.\""
    ))
    story.append(table(
        ["Policy line", "Words that belong"],
        [
            ["Auto", "vehicle, collision, roadside, converter, rear-end, t-bone"],
            ["Fire", "fire, chimney, kitchen, electrical, grease, thermal, water restoration"],
            ["Boat", "marina, hull, marine, boat, dock"],
            ["Caravan", "hail, tree, caravan, storm"],
            ["Private Accident", "slip, fall, laceration, trauma, fracture"],
        ],
        [40 * mm, 130 * mm],
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(p(
        "If none of that line's words appear in the incident type, the mismatch clue is 1. Otherwise it is 0."
    ))
    story.append(h2("Making the numbers the same size"))
    story.append(p(
        "A count of days can be 400. A yes-or-no is only 0 or 1. If we do not resize, the big number shouts. "
        "The first four clues are resized with a sturdy ruler: subtract the middle value, then divide by the spread "
        "between the 25th and 75th percentile. A few wild values cannot drag the middle around. "
        "The yes-or-no clues are left as 0 or 1. "
        "The middles and spreads are saved in <font face='Courier'>data/models/triage_baselines.json</font> "
        "and reused at scoring time. We do not refit them on one new claim."
    ))
    story.append(h2("What is left out of the nine, on purpose"))
    story.append(bullets([
        "The dollar amount of the loss.",
        "What share of the policy limit the loss uses.",
        "The premium, and any premium-to-loss ratio.",
        "How many policies the person holds.",
        "Purchasing power, household size, age, and the demographic label.",
    ]))
    story.append(p(
        "Amount and limit still matter. They go into the size ruler in the next section. "
        "They do not go into the learner that asks \"does this look like a planted trick,\" "
        "because a real large fire would then look like a trick just for being large."
    ))

    story.append(h1("6. The size ruler (not a learner)"))
    story.append(p(
        "Severity answers one question: <b>for this kind of policy, is this a big loss?</b> "
        "A $5,000 car claim and a $5,000 fire claim are not the same kind of \"big.\" "
        "So we compare the amount with the amounts already seen on that same line."
    ))
    story.append(callout(
        "<font face='Courier'><b>size points = (how high you sit among same-line claims) × 70</b></font><br/>"
        "<font face='Courier'><b>+ (share of the limit, capped) × 30</b></font><br/><br/>"
        "\"How high you sit\" is a percentile from 0 to 1. "
        "The limit part is the claim divided by the limit, then divided by 0.85, and it cannot go above 1. "
        "So using 85% or more of the limit fills that 30 points. The two parts add up to at most 100."
    ))
    story.append(p("A plain label sits next to that ruler. It is not the sticker on the screen. It is only about size:"))
    story.append(bullets([
        "<b>High size</b> if the amount is in the top 5% for that line, or the claim uses 60% or more of the limit.",
        "<b>Medium size</b> if the amount is in the top 25%, or the claim uses 25% or more of the limit.",
        "<b>Low size</b> otherwise.",
    ]))
    story.append(p(
        "Filing delay is not in this ruler. A mismatch is not in this ruler. "
        "On the studio screen, coverage is painted red at 60% of the limit or more, amber from 25%, and green below that. "
        "That paint matches the size bands above."
    ))

    story.append(h1("7. The late-note rule"))
    story.append(p(
        "Think of a school note. You have <b>14 days</b> to bring it. "
        "Day 0 through day 14 add <b>nothing</b>. "
        "Day 15 adds 1. Day 16 adds 2. Each extra day adds 1 point. "
        "The add stops at <b>46</b>. Day 60 is 60 − 14 = 46, so it adds 46. Day 200 still adds 46."
    ))
    story.append(p(
        "This is a fixed rule, the way a late library book has a fixed fine. "
        "The learner does not invent the fine. "
        "We still also give the learner \"delay compared with this policy line,\" "
        "so it can notice that some lines usually file faster than others. "
        "The fine and that clue are different jobs. The fine moves the sticker even when the loss is small."
    ))

    story.append(h1("8. The three learners"))
    story.append(p(
        "All three see the same nine clues, already resized. "
        "None of them see the dollar amount. "
        "The matrix is saved as <font face='Courier'>data/processed/ml_feature_matrix.npz</font>."
    ))
    story.append(h2("Learner 1 — the pattern student (XGBoost)"))
    story.append(p(
        "We show it every claim and the answer key: \"was this one of the 180 planted tricks?\" "
        "It grows many small if-then trees that fix each other's mistakes. "
        "Its output is a probability: a number from 0 to 1 meaning \"how much does this look like a planted trick.\""
    ))
    story.append(p(
        "Tricks are only 12% of the book. If we do nothing, a lazy student could say \"never a trick\" and be right most of the time. "
        "So each trick is given extra weight. The weight is the number of ordinary claims divided by the number of tricks "
        "(<font face='Courier'>scale_pos_weight</font>)."
    ))
    story.append(p(
        "We do not grade it on claims it just memorized. We use five folds. "
        "Claims from the <b>same customer stay together</b>: a person's claims are all in the practice pile or all in the test pile, not split. "
        "That stops the student from recognizing a person instead of a pattern."
    ))
    story.append(p("On the last training run:"))
    story.append(bullets([
        "ROC-AUC <b>0.9218</b> (give it one trick and one ordinary claim; it ranks the trick higher about 92 times out of 100). The spread across folds was about ± 0.021.",
        "Precision <b>0.48</b> and recall <b>0.88</b> at a 0.50 cutoff. It catches most planted tricks. About half of the claims it calls a trick are truly planted. It is a wide net, not a verdict.",
        "If this probability is <b>0.80 or higher</b>, the sticker cannot stay under 70. The claim is at least High, even if the loss itself is not large.",
    ]))
    story.append(h2("Learner 2 — the checker (Random Forest)"))
    story.append(p(
        "A second student, a forest of trees that vote, learns the same lesson. "
        "We do not mix its vote into the 0–100 sticker. "
        "We ask: did the two students get almost the same grade? "
        "Last run, forest ROC-AUC was <b>0.9216</b>. The gap versus XGBoost was about <b>0.0002</b>, marked stable. "
        "The clues it leaned on most were \"words do not match\" (about 0.29) and \"delay versus this line\" (about 0.18)."
    ))
    story.append(p(
        "On a single claim, if the two probabilities are within 0.15 of each other, the screen says the agreement is strong. "
        "If they are farther apart, it says they diverge. That is a warning for the person, not a change to the score."
    ))
    story.append(h2("Learner 3 — the loner bell (Isolation Forest)"))
    story.append(p(
        "This one does not study the answer key the way the others do. "
        "It asks: \"is this claim easy to split off from the crowd?\" "
        "Odd combinations of the nine clues get flagged. "
        "We tell it to expect about 12% loners, because that is how many tricks we planted "
        "(<font face='Courier'>contamination = 0.12</font>, 200 trees)."
    ))
    story.append(p(
        "If its predict function returns <b>−1</b>, the claim is an outlier. "
        "That flag is shown beside the sticker. <b>It does not add points and it does not pick Low, Medium, or High.</b> "
        "Its own ROC-AUC on the planted labels was about <b>0.79</b>. Weaker than the pattern student. "
        "That is acceptable, because it is a second look, not the grade."
    ))
    story.append(callout(
        "There is also a batch file of explanations for the 20 claims the pattern student found most suspicious "
        "(<font face='Courier'>shap_top20_explanations.json</font>). "
        "Those saved numbers are on the resized clues. "
        "When you open one claim, the live explainer is preferred. It uses the raw clue values you can read.",
        bg=CREAM, border=Color(0.75, 0.75, 0.78),
    ))

    story.append(h1("9. How the sticker is added up"))
    story.append(p("One formula. Every live score uses it."))
    story.append(callout(
        "<font face='Courier'><b>score = 0.65 × size + 0.35 × (pattern probability × 100) + late points</b></font><br/><br/>"
        "Then, if the pattern probability is 0.80 or more, the score is at least 70.<br/>"
        "Then the score is kept between 0 and 100.<br/><br/>"
        "<b>Under 40</b> is Low (fast lane). <b>40 to 69</b> is Medium (normal review). <b>70 or more</b> is High (a person should look first)."
    , bg=GREEN_BG, border=GREEN))
    story.append(Spacer(1, 3 * mm))
    story.append(h2("The claim that looked fine except it was 60 days late"))
    story.append(p(
        "A small auto loss: <b>$4,500</b> on a <b>$25,000</b> limit. "
        "That is not a big loss for the line, so the size ruler was about <b>24</b>. "
        "The pattern student said about <b>30%</b> (0.3048). Delay was <b>60 days</b>."
    ))
    story.append(table(
        ["Piece", "Math", "Points"],
        [
            ["Size, 65%", "0.65 × 24", "15.6"],
            ["Pattern, 35%", "0.35 × 30.48", "10.7"],
            ["Before the late note", "15.6 + 10.7, rounded", "26  →  Low"],
            ["Late note", "60 − 14 = 46, and 46 is the cap", "+46"],
            ["Sticker", "26 + 46, capped at 100", "72  →  High"],
        ],
        [42 * mm, 80 * mm, 48 * mm],
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(p(
        "Before the late-note rule, this claim stayed Low, because most of the sticker is size, and the loss was small. "
        "The pattern student also did not treat \"60 days\" as a huge deal by itself once the other clues looked ordinary. "
        "The fixed fine is what moves it. "
        "The loner bell can still ring (this one did) without being the thing that changed 26 into 72."
    ))
    story.append(h2("A large honest-looking fire"))
    story.append(p(
        "Claim CLM-2024-01323 is a fire soon after the policy, about <b>$283,872</b>. "
        "The live sticker was <b>93, High</b>. Size was about 93. Pattern was also high. "
        "Here the size ruler is doing a lot of the work: among fire claims, this loss sits near the top, "
        "and it uses a large share of the limit (about 71%, which the studio paints red). "
        "A big genuine loss is allowed to be High. High means \"look first,\" not \"this person cheated.\""
    ))
    story.append(h2("Why SHAP is only half the story"))
    story.append(p(
        "SHAP asks the pattern student: \"which of the nine clues pushed your probability up or down?\" "
        "The screen shows the five strongest pushes. "
        "A positive push means \"this clue made a trick look more likely.\" "
        "SHAP does not explain the size ruler, and it does not explain the late-note points. "
        "Those are outside the student. If you only read SHAP, you will miss why a small late claim became High."
    ))

    story.append(h1("10. The five helpers"))
    story.append(p(
        "When you press the swarm button, five helpers run in a line. "
        "Each one hands a note to the next. The notes are saved so a person can see who said what."
    ))
    story.append(table(
        ["Order", "Helper", "Job"],
        [
            ["1", "Retrieval", "Finds older claims whose stories sound similar (the Chroma library) and looks at neighbors on the relationship map."],
            ["2", "Risk", "Runs the sticker formula above and the SHAP list. This is the 0–100 number."],
            ["3", "Anomaly", "Copies the loner-bell flag. Also adds its own flags: filed after 40 days; a loss over $15,000 filed within 2 days; a household link the map treats as a cluster."],
            ["4", "Summary", "Writes a short brief for the adjuster. It uses Gemini when that is available, and a fixed template when it is not. The brief is supposed to stay inside the file, not invent facts."],
            ["5", "Investigation", "Suggests questions a person could ask and steps a person could take. It does not accuse, and it does not close the claim."],
        ],
        [18 * mm, 32 * mm, 120 * mm],
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(p(
        "The anomaly helper's \"filed after 40 days\" flag is another way of saying the wait was long. "
        "It is a flag in the report. The points themselves still come from the late-note rule in the risk helper "
        "(1 point per day after day 14, cap 46)."
    ))

    story.append(h1("11. What the screens are actually showing"))
    story.append(bullets([
        "<b>New claim form.</b> Lines are Auto, Fire, Boat, Caravan, and Private Accident. Profile fields are labeled as not scored. A delay past day 14 shows the point add before you submit.",
        "<b>Studio.</b> The gauge is the live sticker: size, pattern, and late points. Coverage color follows 25% and 60% of the limit.",
        "<b>Home and evaluation.</b> The 0.9218 figure is the pattern student's ROC-AUC. It is not a blended \"whole system\" accuracy. Isolation Forest is shown as 0.7944 and is not graded as a pass against 0.85.",
        "<b>Portfolio chart.</b> The Low / Medium / High slices are the labels written when the stories were invented, plus any stored score file. They are not a fresh swarm of all 1,500 claims. The outlier count on that page is the count of planted schemes.",
    ]))
    story.append(callout(
        "The saved score file (<font face='Courier'>risk_scores.csv</font>) was written before the late-note rule was added. "
        "A claim you open and swarm today uses the late-note rule. "
        "A chart that reads the old file does not. If those two disagree, the live swarm is the current rule.",
        bg=AMBER_BG, border=AMBER,
    ))

    story.append(h1("12. One claim, from click to sticker"))
    story.append(bullets([
        "You type the line, the amount, the limit, the dates, the delay, and the story.",
        "The app builds one claim folder. Missing \"days since the policy started\" becomes 400. Missing prior claims and linked claims become 0.",
        "Size ruler: compare the amount with saved amounts for that line, add the limit share.",
        "Nine clues are built and resized with the saved middles and spreads.",
        "XGBoost returns a probability. Random Forest returns a second probability for the agreement check. Isolation Forest returns outlier or not.",
        "Late points are computed from the delay. The formula adds size, pattern, and late points, applies the 0.80 floor, and caps at 100.",
        "The band is chosen: under 40, 40 to 69, or 70 and up.",
        "SHAP lists the clues that moved the pattern probability.",
        "The other helpers add similar stories, flags, a short brief, and questions.",
        "You read it. You decide. Nothing is paid or refused by the model.",
    ]))

    story.append(h1("13. Pocket card"))
    story.append(table(
        ["Question", "Answer"],
        [
            ["How many claims?", "1,500 written. 180 (12%) are planted tricks. Seed 42."],
            ["What enters the learner?", "Nine behavior clues. Not dollars, not class, not policy count."],
            ["What is the sticker?", "65% size + 35% pattern probability + late points. Then a floor at 70 if pattern is at least 80%."],
            ["Late points?", "0 through day 14. Then 1 per day. Cap 46. Day 60 = +46."],
            ["Who sets the band?", "Under 40 Low, 40–69 Medium, 70+ High."],
            ["Does Isolation Forest change it?", "No. −1 means \"show an outlier flag.\""],
            ["Does Random Forest change it?", "No. It checks that XGBoost is not a fluke."],
            ["Does SHAP explain the whole sticker?", "No. Only the pattern half."],
            ["Who decides the money?", "A person. Always."],
        ],
        [55 * mm, 115 * mm],
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(note(
        "Source of the numbers: the training run and the scoring code in this project "
        "(triage_features.py, claim_factory.py, ensemble_scorer.py, the analytics pipeline). "
        "If the book is rebuilt, the AUC figures can move a little. The rules in this PDF are the rules in the code."
    ))
    return story


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc = SimpleDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=16 * mm,
        title="How Analyster Works",
        author="Analyster",
    )
    doc.build(build(), onFirstPage=cover_page, onLaterPages=header_footer)
    print(OUT)


if __name__ == "__main__":
    main()
