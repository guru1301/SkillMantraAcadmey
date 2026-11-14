import os
import math
from PIL import Image, ImageDraw, ImageFont

os.makedirs('public/images/courses', exist_ok=True)

WIDTH = 800
HEIGHT = 450

COURSES = [
    {
        'id': 'java',
        'title': 'Java Programming',
        'category': 'ENTERPRISE ENGINEERING',
        'tagline': 'Spring Boot & Microservices',
        'logo': 'public/images/tech/java.png',
        'bg_accent': (23, 105, 210),  # blue
        'highlight': (255, 176, 0),   # gold
        'diagram_type': 'microservices'
    },
    {
        'id': 'python',
        'title': 'Python Programming',
        'category': 'CORE PROGRAMMING',
        'tagline': 'Async IO & Data Pipelines',
        'logo': 'public/images/tech/python.png',
        'bg_accent': (53, 114, 165),
        'highlight': (255, 212, 59),
        'diagram_type': 'async_pipeline'
    },
    {
        'id': 'web',
        'title': 'Web & Full Stack Development',
        'category': 'SOFTWARE ENGINEERING',
        'tagline': 'React, Node.js & Cloud APIs',
        'logo': 'public/images/tech/react.png',
        'bg_accent': (0, 150, 214),
        'highlight': (97, 218, 251),
        'diagram_type': 'browser_stack'
    },
    {
        'id': 'dotnet',
        'title': '.NET Development',
        'category': 'ENTERPRISE ENGINEERING',
        'tagline': 'ASP.NET Core & Cloud Services',
        'logo': 'public/images/tech/dotnet.png',
        'bg_accent': (81, 43, 212),
        'highlight': (160, 130, 255),
        'diagram_type': 'cloud_api'
    },
    {
        'id': 'analytics',
        'title': 'Data Analytics & BI',
        'category': 'DATA & ANALYTICS',
        'tagline': 'Power BI & Executive Intelligence',
        'logo': 'public/images/tech/powerbi.png',
        'bg_accent': (242, 200, 17),
        'highlight': (255, 176, 0),
        'diagram_type': 'bi_dashboard'
    },
    {
        'id': 'ai',
        'title': 'AI & Emerging Technologies',
        'category': 'AI & EMERGING',
        'tagline': 'Generative AI & Agentic RAG',
        'logo': 'public/images/tech/ai.png',
        'bg_accent': (120, 80, 220),
        'highlight': (180, 140, 255),
        'diagram_type': 'neural_rag'
    },
    {
        'id': 'database',
        'title': 'Database & Backend Tech',
        'category': 'BACKEND & DATA',
        'tagline': 'Relational & NoSQL Architecture',
        'logo': 'public/images/tech/database.png',
        'bg_accent': (51, 103, 145),
        'highlight': (78, 170, 230),
        'diagram_type': 'schema_ddl'
    },
    {
        'id': 'cpp',
        'title': 'Programming Fundamentals',
        'category': 'CORE PROGRAMMING',
        'tagline': 'Memory Models & Data Structures',
        'logo': 'public/images/tech/cpp.png',
        'bg_accent': (0, 89, 156),
        'highlight': (101, 154, 210),
        'diagram_type': 'memory_nodes'
    },
    {
        'id': 'aptitude',
        'title': 'Aptitude & Placement Training',
        'category': 'PLACEMENT & CAREER',
        'tagline': 'Quantitative & Technical Readiness',
        'logo': 'public/images/tech/aptitude.png',
        'bg_accent': (16, 185, 129),
        'highlight': (52, 211, 153),
        'diagram_type': 'placement_matrix'
    },
    {
        'id': 'marketing',
        'title': 'Digital Marketing',
        'category': 'DIGITAL & GROWTH',
        'tagline': 'Technical SEO & Tag Tracking',
        'logo': 'public/images/tech/marketing.png',
        'bg_accent': (234, 88, 12),
        'highlight': (251, 146, 60),
        'diagram_type': 'analytics_funnel'
    }
]

def create_card_image(cfg):
    # Base deep navy
    img = Image.new('RGB', (WIDTH, HEIGHT), color=(7, 24, 43))
    draw = ImageDraw.Draw(img)

    # Gradient background simulation
    for y in range(HEIGHT):
        factor = y / HEIGHT
        r = int(7 + (13 - 7) * factor)
        g = int(24 + (35 - 24) * factor)
        b = int(43 + (59 - 43) * factor)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Architectural grid lines
    grid_color = (25, 45, 70)
    for x in range(0, WIDTH, 50):
        draw.line([(x, 0), (x, HEIGHT)], fill=grid_color, width=1)
    for y in range(0, HEIGHT, 50):
        draw.line([(0, y), (WIDTH, y)], fill=grid_color, width=1)

    # Subtle ambient glow in center-right
    glow_color = cfg['bg_accent']
    for rad in range(180, 20, -10):
        alpha_mult = (180 - rad) / 180.0
        gr = int(7 + (glow_color[0] - 7) * 0.18 * alpha_mult)
        gg = int(24 + (glow_color[1] - 24) * 0.18 * alpha_mult)
        gb = int(43 + (glow_color[2] - 43) * 0.18 * alpha_mult)
        draw.ellipse([540 - rad, 225 - rad, 540 + rad, 225 + rad], fill=(gr, gg, gb))

    # Discipline Diagram Drawing (Geometric & Technical)
    dtype = cfg['diagram_type']

    if dtype == 'microservices':
        # Service cluster blocks
        nodes = [(420, 140, 'API Gateway'), (620, 100, 'Order Service'), (620, 220, 'Auth Service'), (620, 340, 'JPA Repository')]
        for x, y, name in nodes:
            draw.rounded_rectangle([x, y, x + 140, y + 50], radius=8, fill=(16, 42, 69), outline=cfg['highlight'], width=2)
            draw.text((x + 15, y + 18), name, fill=(240, 245, 255))
        draw.line([(560, 165), (620, 125)], fill=(100, 150, 220), width=2)
        draw.line([(560, 165), (620, 245)], fill=(100, 150, 220), width=2)
        draw.line([(690, 270), (690, 340)], fill=(100, 150, 220), width=2)

    elif dtype == 'async_pipeline':
        # Async stream lines & worker nodes
        draw.arc([400, 100, 720, 350], start=0, end=360, fill=cfg['highlight'], width=3)
        draw.rounded_rectangle([440, 190, 680, 260], radius=10, fill=(16, 42, 69), outline=(100, 150, 220), width=2)
        draw.text((470, 215), 'AsyncIO Event Loop: Active', fill=(255, 255, 255))
        for angle in [30, 90, 150, 210, 270, 330]:
            rad = math.radians(angle)
            nx = 560 + int(140 * math.cos(rad))
            ny = 225 + int(110 * math.sin(rad))
            draw.ellipse([nx - 10, ny - 10, nx + 10, ny + 10], fill=cfg['highlight'])

    elif dtype == 'browser_stack':
        # Miniature browser window & React component hierarchy
        draw.rounded_rectangle([400, 90, 740, 360], radius=12, fill=(16, 42, 69), outline=(60, 100, 150), width=2)
        draw.rectangle([400, 90, 740, 125], fill=(24, 55, 88))
        draw.ellipse([415, 103, 427, 115], fill=(239, 68, 68))
        draw.ellipse([435, 103, 447, 115], fill=(245, 158, 11))
        draw.ellipse([455, 103, 467, 115], fill=(16, 185, 129))
        draw.text((480, 101), 'https://react-tanstack.app', fill=(184, 198, 216))
        # Inner wireframe
        draw.rounded_rectangle([420, 145, 540, 340], radius=6, fill=(10, 30, 50))
        draw.rounded_rectangle([555, 145, 720, 230], radius=6, fill=(20, 50, 80))
        draw.rounded_rectangle([555, 245, 720, 340], radius=6, fill=(20, 50, 80))

    elif dtype == 'cloud_api':
        # ASP.NET Cloud infrastructure blocks
        draw.rounded_rectangle([420, 110, 720, 340], radius=12, fill=(16, 42, 69), outline=cfg['highlight'], width=2)
        draw.text((440, 130), 'Microsoft .NET Enterprise Service', fill=cfg['highlight'])
        blocks = [(440, 170, 'C# Web API'), (580, 170, 'EF Core ORM'), (440, 250, 'SQL Server'), (580, 250, 'Azure Cloud')]
        for bx, by, bt in blocks:
            draw.rounded_rectangle([bx, by, bx + 120, by + 60], radius=8, fill=(26, 60, 96), outline=(90, 120, 170), width=1)
            draw.text((bx + 15, by + 22), bt, fill=(255, 255, 255))

    elif dtype == 'bi_dashboard':
        # Power BI charts & telemetry
        draw.rounded_rectangle([400, 90, 740, 360], radius=12, fill=(16, 42, 69), outline=cfg['highlight'], width=2)
        # Bar chart
        bars = [60, 110, 150, 95, 170, 130, 190]
        for i, h in enumerate(bars):
            bx = 430 + i * 40
            by = 330 - h
            draw.rounded_rectangle([bx, by, bx + 26, 330], radius=4, fill=cfg['highlight'])
        # Metric card
        draw.rounded_rectangle([430, 110, 550, 160], radius=6, fill=(10, 30, 50))
        draw.text((445, 120), 'GROSS RETURN', fill=(143, 165, 194))
        draw.text((445, 135), '+42.8% YOY', fill=(16, 185, 129))

    elif dtype == 'neural_rag':
        # Neural nodes & Vector embeddings path
        layers = [
            [(430, 130), (430, 220), (430, 310)],
            [(540, 100), (540, 180), (540, 260), (540, 340)],
            [(650, 150), (650, 240), (650, 320)],
            [(720, 225)]
        ]
        for i in range(len(layers) - 1):
            for n1 in layers[i]:
                for n2 in layers[i+1]:
                    draw.line([n1, n2], fill=(40, 70, 110), width=1)
        for l in layers:
            for x, y in l:
                draw.ellipse([x - 10, y - 10, x + 10, y + 10], fill=(16, 42, 69), outline=cfg['highlight'], width=2)

    elif dtype == 'schema_ddl':
        # Database tables with relational connectors
        draw.rounded_rectangle([420, 100, 580, 220], radius=8, fill=(16, 42, 69), outline=(78, 170, 230), width=2)
        draw.rectangle([420, 100, 580, 130], fill=(28, 64, 100))
        draw.text((435, 108), 'TABLE: accounts (PK)', fill=(255, 255, 255))
        draw.text((435, 140), 'id: UUID PRIMARY', fill=(184, 198, 216))
        draw.text((435, 165), 'email: VARCHAR(255)', fill=(184, 198, 216))
        draw.text((435, 190), 'created_at: TIMESTAMP', fill=(184, 198, 216))

        draw.rounded_rectangle([560, 230, 720, 350], radius=8, fill=(16, 42, 69), outline=(78, 170, 230), width=2)
        draw.rectangle([560, 230, 720, 260], fill=(28, 64, 100))
        draw.text((575, 238), 'TABLE: transactions', fill=(255, 255, 255))
        draw.text((575, 270), 'account_id: FK_USER', fill=(255, 212, 59))
        draw.text((575, 295), 'amount: NUMERIC(12,2)', fill=(184, 198, 216))
        draw.text((575, 320), 'status: ENUM_ACTIVE', fill=(184, 198, 216))
        draw.line([(500, 220), (500, 280), (560, 280)], fill=(255, 212, 59), width=2)

    elif dtype == 'memory_nodes':
        # Linked list pointer addresses & memory blocks
        ptrs = [('HEAD: 0x7ffd10', 410, 140), ('NODE: 0x7ffd28', 520, 200), ('TAIL: 0x7ffd40', 630, 260)]
        for label, px, py in ptrs:
            draw.rounded_rectangle([px, py, px + 120, py + 70], radius=8, fill=(16, 42, 69), outline=cfg['highlight'], width=2)
            draw.text((px + 10, py + 12), label, fill=cfg['highlight'])
            draw.text((px + 10, py + 38), 'val: int | next*', fill=(255, 255, 255))
        draw.line([(530, 175), (550, 175), (550, 200)], fill=(100, 160, 230), width=2)
        draw.line([(640, 235), (660, 235), (660, 260)], fill=(100, 160, 230), width=2)

    elif dtype == 'placement_matrix':
        # Campus placement diagnostic scorecard
        draw.rounded_rectangle([410, 100, 730, 350], radius=12, fill=(16, 42, 69), outline=(16, 185, 129), width=2)
        draw.text((435, 120), 'CAMPUS READINESS EVALUATION', fill=(16, 185, 129))
        skills = [('Quantitative Aptitude', 92), ('Logical Reasoning', 88), ('Verbal & Communication', 95), ('Coding Round Technical', 90)]
        for i, (name, pct) in enumerate(skills):
            sy = 160 + i * 45
            draw.text((435, sy), name, fill=(220, 230, 245))
            draw.rounded_rectangle([435, sy + 20, 700, sy + 28], radius=4, fill=(10, 30, 50))
            draw.rounded_rectangle([435, sy + 20, 435 + int(2.65 * pct), sy + 28], radius=4, fill=(16, 185, 129))

    elif dtype == 'analytics_funnel':
        # Marketing conversion funnel & Core Web Vitals
        draw.polygon([(420, 120), (720, 120), (660, 170), (480, 170)], fill=(234, 88, 12))
        draw.text((520, 138), 'Impressions: 124,000', fill=(255, 255, 255))
        draw.polygon([(480, 180), (660, 180), (620, 230), (520, 230)], fill=(249, 115, 22))
        draw.text((530, 198), 'Site Traffic: 42,500', fill=(255, 255, 255))
        draw.polygon([(520, 240), (620, 240), (590, 290), (550, 290)], fill=(251, 146, 60))
        draw.text((540, 258), 'Qualified: 6,800', fill=(255, 255, 255))
        draw.rounded_rectangle([545, 300, 595, 340], radius=6, fill=(254, 215, 170))
        draw.text((552, 314), 'Enroll', fill=(154, 52, 18))

    # Left content overlay panel
    # Subtle dark gradient on left to ensure high readability
    for x in range(0, 450):
        fade = max(0, 1.0 - (x / 450.0))
        alpha_val = int(240 * fade)
        draw.line([(x, 0), (x, HEIGHT)], fill=(7, 24, 43))

    # Category Tag
    draw.rounded_rectangle([40, 45, 280, 75], radius=6, fill=(16, 42, 69), outline=(40, 70, 110), width=1)
    draw.text((55, 52), cfg['category'], fill=cfg['highlight'])

    # Title
    draw.text((40, 95), cfg['title'], fill=(255, 255, 255))

    # Tagline
    draw.text((40, 135), cfg['tagline'], fill=(184, 198, 216))

    # Overlay Official Logo on Left
    if os.path.exists(cfg['logo']):
        logo = Image.open(cfg['logo']).convert('RGBA')
        logo.thumbnail((90, 90), Image.Resampling.LANCZOS)
        # Background plate for logo
        draw.rounded_rectangle([40, 190, 150, 300], radius=16, fill=(16, 42, 69), outline=(40, 70, 110), width=1)
        # Paste centered
        lx = 40 + (110 - logo.width) // 2
        ly = 190 + (110 - logo.height) // 2
        img.paste(logo, (lx, ly), logo)

    # Footprint badge
    draw.text((40, 340), 'Skillthinker Institutional Curriculum', fill=(143, 165, 194))
    draw.text((40, 365), 'Trichy Campus Technical Lab', fill=(255, 176, 0))

    # Border
    draw.rectangle([0, 0, WIDTH - 1, HEIGHT - 1], outline=(30, 58, 95), width=1)

    out_path = f"public/images/courses/{cfg['id']}.jpg"
    img.save(out_path, 'JPEG', quality=95)
    print(f"Saved: {out_path}")

for c in COURSES:
    create_card_image(c)

print('All 10 course images generated successfully.')
