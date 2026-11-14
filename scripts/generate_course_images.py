import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

os.makedirs('public/images/courses', exist_ok=True)

WIDTH = 640
HEIGHT = 360  # Exact 16:9

COURSES = [
    {
        'id': 'java',
        'title': 'Java Programming',
        'subtitle': 'Spring Boot 3.2 & Microservices Architecture',
        'badge': 'ENTERPRISE',
        'logo': 'public/images/tech/java.png',
        'color1': (10, 25, 48),
        'color2': (20, 60, 110),
        'accent': (255, 176, 0),
        'accent2': (23, 105, 210),
        'pattern': 'server_nodes'
    },
    {
        'id': 'python',
        'title': 'Python Programming',
        'subtitle': 'FastAPI, Async IO & Software Engineering',
        'badge': 'CORE PROGRAMMING',
        'logo': 'public/images/tech/python.png',
        'color1': (12, 30, 50),
        'color2': (25, 75, 120),
        'accent': (255, 212, 59),
        'accent2': (55, 118, 171),
        'pattern': 'async_loop'
    },
    {
        'id': 'web',
        'title': 'Web & Full Stack',
        'subtitle': 'React.js, Node.js, Tailwind & Cloud Deploy',
        'badge': 'FULL STACK',
        'logo': 'public/images/tech/react.png',
        'color1': (8, 28, 48),
        'color2': (15, 65, 105),
        'accent': (97, 218, 251),
        'accent2': (0, 150, 214),
        'pattern': 'browser_code'
    },
    {
        'id': 'dotnet',
        'title': '.NET Development',
        'subtitle': 'ASP.NET Core, EF Core & Azure Microservices',
        'badge': 'ENTERPRISE',
        'logo': 'public/images/tech/dotnet.png',
        'color1': (16, 20, 50),
        'color2': (45, 30, 100),
        'accent': (170, 130, 255),
        'accent2': (81, 43, 212),
        'pattern': 'cloud_api'
    },
    {
        'id': 'analytics',
        'title': 'Data Analytics & BI',
        'subtitle': 'Power BI, Advanced SQL, DAX & Dashboards',
        'badge': 'ANALYTICS',
        'logo': 'public/images/tech/powerbi.png',
        'color1': (18, 28, 40),
        'color2': (65, 55, 20),
        'accent': (255, 185, 0),
        'accent2': (242, 200, 17),
        'pattern': 'bi_charts'
    },
    {
        'id': 'ai',
        'title': 'AI & Emerging Tech',
        'subtitle': 'Generative AI, LangChain, RAG & Agents',
        'badge': 'AI SPECIALIZATION',
        'logo': 'public/images/tech/ai.png',
        'color1': (15, 18, 45),
        'color2': (40, 25, 90),
        'accent': (210, 150, 255),
        'accent2': (140, 80, 240),
        'pattern': 'neural_rag'
    },
    {
        'id': 'database',
        'title': 'Database & Backend',
        'subtitle': 'PostgreSQL, MongoDB, Indexing & DDL',
        'badge': 'BACKEND',
        'logo': 'public/images/tech/database.png',
        'color1': (10, 26, 44),
        'color2': (20, 65, 95),
        'accent': (78, 180, 240),
        'accent2': (51, 103, 145),
        'pattern': 'schema_tables'
    },
    {
        'id': 'cpp',
        'title': 'Programming Logic',
        'subtitle': 'C, C++, Data Structures & Memory Models',
        'badge': 'FOUNDATIONS',
        'logo': 'public/images/tech/cpp.png',
        'color1': (8, 25, 45),
        'color2': (18, 55, 95),
        'accent': (120, 180, 255),
        'accent2': (0, 89, 156),
        'pattern': 'memory_nodes'
    },
    {
        'id': 'aptitude',
        'title': 'Placement Training',
        'subtitle': 'Speed Math, Logical Puzzles & Mock Interviews',
        'badge': 'CAREER & HIRING',
        'logo': 'public/images/tech/aptitude.png',
        'color1': (10, 30, 35),
        'color2': (15, 70, 60),
        'accent': (52, 211, 153),
        'accent2': (16, 185, 129),
        'pattern': 'placement_matrix'
    },
    {
        'id': 'marketing',
        'title': 'Digital Marketing',
        'subtitle': 'Technical SEO, GTM Telemetry & User Funnels',
        'badge': 'GROWTH',
        'logo': 'public/images/tech/marketing.png',
        'color1': (25, 20, 25),
        'color2': (80, 45, 20),
        'accent': (251, 146, 60),
        'accent2': (234, 88, 12),
        'pattern': 'analytics_funnel'
    }
]

def render_thumbnail(c):
    # Base image with vibrant dark gradient
    img = Image.new('RGB', (WIDTH, HEIGHT), color=c['color1'])
    draw = ImageDraw.Draw(img)

    c1 = c['color1']
    c2 = c['color2']
    # Smooth diagonal gradient
    for y in range(HEIGHT):
        for x in range(0, WIDTH, 4):
            factor = (x / WIDTH * 0.7) + (y / HEIGHT * 0.3)
            r = int(c1[0] + (c2[0] - c1[0]) * factor)
            g = int(c1[1] + (c2[1] - c1[1]) * factor)
            b = int(c1[2] + (c2[2] - c1[2]) * factor)
            draw.rectangle([x, y, x + 4, y + 1], fill=(r, g, b))

    # Grid lines for high-tech aesthetic
    grid_col = (255, 255, 255, 12)
    for gx in range(0, WIDTH, 32):
        draw.line([(gx, 0), (gx, HEIGHT)], fill=(30, 50, 75))
    for gy in range(0, HEIGHT, 32):
        draw.line([(0, gy), (WIDTH, gy)], fill=(30, 50, 75))

    # Ambient glow on the right
    glow_col = c['accent2']
    for rad in range(160, 20, -12):
        factor = (160 - rad) / 160.0
        gr = int(c1[0] + (glow_col[0] - c1[0]) * 0.35 * factor)
        gg = int(c1[1] + (glow_col[1] - c1[1]) * 0.35 * factor)
        gb = int(c1[2] + (glow_col[2] - c1[2]) * 0.35 * factor)
        draw.ellipse([460 - rad, 180 - rad, 460 + rad, 180 + rad], fill=(gr, gg, gb))

    # Graphic patterns on the right half
    pat = c['pattern']
    if pat == 'server_nodes':
        # Server architecture nodes
        boxes = [(380, 80, 'REST API'), (500, 50, 'Spring Boot'), (500, 150, 'Auth JWT'), (500, 250, 'JPA Data')]
        for bx, by, text in boxes:
            draw.rounded_rectangle([bx, by, bx + 110, by + 45], radius=6, fill=(15, 35, 60), outline=c['accent'], width=2)
            draw.text((bx + 10, by + 16), text, fill=(255, 255, 255))
        draw.line([(490, 102), (500, 72)], fill=(120, 170, 230), width=2)
        draw.line([(490, 102), (500, 172)], fill=(120, 170, 230), width=2)
        draw.line([(555, 195), (555, 250)], fill=(120, 170, 230), width=2)

    elif pat == 'async_loop':
        # Async event loop
        draw.arc([360, 60, 580, 280], start=0, end=360, fill=c['accent'], width=3)
        draw.rounded_rectangle([400, 140, 540, 200], radius=8, fill=(18, 45, 75), outline=(100, 160, 230), width=2)
        draw.text((420, 162), 'AsyncIO Loop', fill=(255, 255, 255))
        for deg in [45, 135, 225, 315]:
            rad = math.radians(deg)
            nx = 470 + int(110 * math.cos(rad))
            ny = 170 + int(110 * math.sin(rad))
            draw.ellipse([nx - 10, ny - 10, nx + 10, ny + 10], fill=c['accent'])

    elif pat == 'browser_code':
        # Browser preview with React components
        draw.rounded_rectangle([360, 60, 600, 290], radius=8, fill=(16, 40, 65), outline=(60, 120, 180), width=2)
        draw.rectangle([360, 60, 600, 88], fill=(25, 55, 90))
        draw.ellipse([372, 70, 382, 80], fill=(239, 68, 68))
        draw.ellipse([388, 70, 398, 80], fill=(245, 158, 11))
        draw.ellipse([404, 70, 414, 80], fill=(16, 185, 129))
        draw.text((430, 68), 'react-app.tsx', fill=(180, 205, 235))
        # UI blocks
        draw.rounded_rectangle([375, 105, 470, 270], radius=4, fill=(10, 28, 48))
        draw.rounded_rectangle([485, 105, 585, 175], radius=4, fill=(20, 50, 80))
        draw.rounded_rectangle([485, 190, 585, 270], radius=4, fill=(20, 50, 80))

    elif pat == 'cloud_api':
        draw.rounded_rectangle([370, 70, 590, 280], radius=10, fill=(25, 25, 65), outline=c['accent'], width=2)
        draw.text((390, 85), 'ASP.NET Core Cloud APIs', fill=c['accent'])
        draw.rounded_rectangle([390, 115, 480, 175], radius=6, fill=(40, 35, 90))
        draw.text((400, 138), 'C# Web API', fill=(255, 255, 255))
        draw.rounded_rectangle([495, 115, 575, 175], radius=6, fill=(40, 35, 90))
        draw.text((505, 138), 'EF Core', fill=(255, 255, 255))
        draw.rounded_rectangle([390, 195, 575, 260], radius=6, fill=(30, 45, 95))
        draw.text((420, 220), 'SQL Server Enterprise', fill=(180, 205, 240))

    elif pat == 'bi_charts':
        draw.rounded_rectangle([360, 60, 600, 290], radius=8, fill=(22, 35, 48), outline=c['accent'], width=2)
        # Power BI style bar chart
        bars = [40, 80, 120, 75, 140, 100, 160]
        for i, h in enumerate(bars):
            bx = 385 + i * 30
            by = 260 - h
            draw.rounded_rectangle([bx, by, bx + 20, 260], radius=3, fill=c['accent'])
        draw.rounded_rectangle([385, 75, 490, 110], radius=4, fill=(10, 25, 40))
        draw.text((395, 85), 'KPI: +38.5% DAX', fill=(16, 185, 129))

    elif pat == 'neural_rag':
        layers = [
            [(380, 90), (380, 170), (380, 250)],
            [(470, 70), (470, 135), (470, 205), (470, 270)],
            [(560, 110), (560, 180), (560, 240)]
        ]
        for i in range(len(layers) - 1):
            for n1 in layers[i]:
                for n2 in layers[i+1]:
                    draw.line([n1, n2], fill=(60, 45, 110), width=1)
        for l in layers:
            for x, y in l:
                draw.ellipse([x - 8, y - 8, x + 8, y + 8], fill=(25, 20, 60), outline=c['accent'], width=2)

    elif pat == 'schema_tables':
        draw.rounded_rectangle([370, 70, 490, 170], radius=6, fill=(16, 40, 65), outline=c['accent'], width=2)
        draw.rectangle([370, 70, 490, 95], fill=(28, 65, 105))
        draw.text((380, 76), 'accounts_pk', fill=(255, 255, 255))
        draw.text((380, 105), 'id: uuid (pk)', fill=(180, 200, 225))
        draw.text((380, 130), 'user_id: text', fill=(180, 200, 225))

        draw.rounded_rectangle([480, 160, 600, 270], radius=6, fill=(16, 40, 65), outline=c['accent'], width=2)
        draw.rectangle([480, 160, 600, 185], fill=(28, 65, 105))
        draw.text((490, 166), 'orders_fk', fill=(255, 255, 255))
        draw.text((490, 195), 'account_id: fk', fill=(255, 212, 59))
        draw.text((490, 220), 'amount: numeric', fill=(180, 200, 225))
        draw.line([(430, 170), (430, 210), (480, 210)], fill=(255, 212, 59), width=2)

    elif pat == 'memory_nodes':
        ptrs = [('0x7ffd10', 370, 90), ('0x7ffd28', 450, 150), ('0x7ffd40', 530, 210)]
        for addr, px, py in ptrs:
            draw.rounded_rectangle([px, py, px + 85, py + 50], radius=6, fill=(16, 38, 65), outline=c['accent'], width=2)
            draw.text((px + 8, py + 8), addr, fill=c['accent'])
            draw.text((px + 8, py + 26), 'data | *next', fill=(255, 255, 255))
        draw.line([(455, 115), (470, 115), (470, 150)], fill=(100, 160, 230), width=2)
        draw.line([(535, 175), (550, 175), (550, 210)], fill=(100, 160, 230), width=2)

    elif pat == 'placement_matrix':
        draw.rounded_rectangle([360, 65, 600, 290], radius=10, fill=(15, 45, 45), outline=c['accent'], width=2)
        draw.text((380, 80), 'CAMPUS READINESS MATRIX', fill=c['accent'])
        metrics = [('Quantitative Aptitude', 94), ('Logical Reasoning', 90), ('Coding Technical Round', 92), ('Mock Interview Readiness', 96)]
        for idx, (mname, pct) in enumerate(metrics):
            my = 115 + idx * 40
            draw.text((380, my), mname, fill=(210, 235, 230))
            draw.rounded_rectangle([380, my + 16, 580, my + 24], radius=3, fill=(10, 28, 28))
            draw.rounded_rectangle([380, my + 16, 380 + int(2.0 * pct), my + 24], radius=3, fill=c['accent'])

    elif pat == 'analytics_funnel':
        draw.polygon([(380, 80), (590, 80), (545, 130), (425, 130)], fill=(234, 88, 12))
        draw.text((450, 98), 'Traffic: 140,000', fill=(255, 255, 255))
        draw.polygon([(425, 140), (545, 140), (510, 190), (455, 190)], fill=(249, 115, 22))
        draw.text((455, 158), 'Qualified: 28,000', fill=(255, 255, 255))
        draw.polygon([(455, 200), (510, 200), (490, 250), (475, 250)], fill=(251, 146, 60))
        draw.text((465, 218), 'Enroll', fill=(255, 255, 255))

    # Left Dark Vignette / Gradient for text readability
    for x in range(0, 380):
        fade = max(0.0, 1.0 - (x / 380.0))
        alpha_v = int(245 * fade)
        draw.line([(x, 0), (x, HEIGHT)], fill=(c1[0], c1[1], c1[2]))

    # Top badge (e.g. ENTERPRISE)
    draw.rounded_rectangle([30, 35, 175, 60], radius=4, fill=(18, 42, 70), outline=c['accent'], width=1)
    draw.text((42, 41), c['badge'], fill=c['accent'])

    # Course Title
    draw.text((30, 75), c['title'], fill=(255, 255, 255))

    # Course Subtitle
    draw.text((30, 105), c['subtitle'], fill=(180, 200, 225))

    # Technology Emblem Placed on bottom-left
    if os.path.exists(c['logo']):
        logo = Image.open(c['logo']).convert('RGBA')
        logo.thumbnail((70, 70), Image.Resampling.LANCZOS)
        # Circular / rounded base for emblem
        draw.rounded_rectangle([30, 155, 115, 240], radius=12, fill=(15, 36, 62), outline=(40, 75, 115), width=1)
        lx = 30 + (85 - logo.width) // 2
        ly = 155 + (85 - logo.height) // 2
        img.paste(logo, (lx, ly), logo)

    # Campus & Credentials footer watermark
    draw.text((30, 280), 'Skillthinker Lab Series', fill=(140, 165, 195))
    draw.text((30, 305), 'Anna Nagar, Trichy Hub', fill=(255, 176, 0))

    # Border
    draw.rectangle([0, 0, WIDTH - 1, HEIGHT - 1], outline=(35, 65, 105), width=1)

    out_file = f"public/images/courses/{c['id']}.jpg"
    img.save(out_file, 'JPEG', quality=95)
    print(f"Rendered: {out_file}")

for item in COURSES:
    render_thumbnail(item)

print('All 10 thumbnails rendered successfully.')
