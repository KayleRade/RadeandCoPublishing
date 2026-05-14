(function () {
    const books = [
        {
            slug: "travel-agent-planner",
            title: "Travel Agent Planner",
            category: "Professional Tools",
            image: "assets/social-preview.png",
            description: "A practical planner for travel professionals who need client details, bookings, and itinerary planning in one place. It helps organize the moving parts of a busy agency workflow with more clarity and less chaos.",
            longDescription: "The Travel Agent Planner is built for travel professionals who need a beautiful, practical way to manage client details, bookings, itineraries, and follow-up in one place. It helps transform scattered planning into a more confident, polished workflow.",
            amazonUrl: "https://www.amazon.com/dp/B09KN4J6QG",
            tags: ["Bestseller"],
            heroStats: ["Trusted flagship title", "Business workflow support"],
            details: {
                audience: "Travel agents, advisors, and service professionals who want a more organized process for client management and trip planning.",
                problem: "It solves the problem of fragmented notes, scattered booking details, and inconsistent follow-up across too many tools.",
                outcome: "Readers get a clear, elevated planning system that supports daily operations, client confidence, and better business flow."
            },
            proof: {
                rating: 4.8,
                reviewCount: 127,
                headline: "A planner that feels practical and professional",
                snippet: "\"Exactly what I needed to organize client bookings and keep every travel detail in one place. It feels beautifully designed, but it is also genuinely useful day to day.\""
            },
            benefits: [
                { title: "Keeps bookings together", body: "Track clients, trip details, and workflow notes in one place.", icon: "briefcase" },
                { title: "Supports client confidence", body: "Bring more structure and polish to communication and planning.", icon: "spark" },
                { title: "Reduces scattered systems", body: "Move away from split notes, tabs, and loose paper workflows.", icon: "grid" },
                { title: "Feels beautiful to use", body: "The layout supports focus with calm, intentional page design.", icon: "book" }
            ]
        },
        {
            slug: "photography-planner",
            title: "Photography Planner",
            category: "Professional Tools",
            image: "https://lh3.googleusercontent.com/d/165f6Dxbc8nEt8NTeBL2mDY_6MRnoNgHh=w1000",
            description: "Designed for photographers managing shoots, timelines, and creative prep. It keeps planning details together so projects feel more polished from inquiry to delivery.",
            longDescription: "A polished planner for photographers balancing shoots, schedules, client notes, and creative logistics. It helps keep projects aligned from planning through delivery.",
            amazonUrl: "https://www.amazon.com/dp/B0BZFRYPTF",
            tags: [],
            heroStats: ["Creative workflow support", "Clean planning format"],
            details: {
                audience: "Photographers, creatives, and service providers who need a thoughtful place to manage project details and timelines.",
                problem: "It solves the frustration of juggling shoot notes, schedules, and client information across disconnected tools.",
                outcome: "Readers get a cleaner creative workflow and a more consistent way to prepare, capture, and follow through."
            },
            proof: {
                rating: 4.6,
                reviewCount: 42,
                headline: "A strong fit for creative planning",
                snippet: "\"It keeps my shoot details together and feels much more intentional than using random notebooks or digital scraps.\""
            },
            benefits: [
                { title: "Organizes shoot planning", body: "Keep timelines, locations, and prep notes easy to review.", icon: "grid" },
                { title: "Supports client work", body: "Track project details in a way that feels professional and reliable.", icon: "briefcase" },
                { title: "Built for creatives", body: "The layout balances practical planning with a polished visual feel.", icon: "spark" }
            ]
        },
        {
            slug: "true-or-false-vol-1",
            title: "True or False Vol. 1",
            category: "Kids & Family",
            image: "../assets/true-or-false-vol-1-cover.png",
            siteImage: "assets/true-or-false-vol-1-cover.png",
            description: "A bright, game-style family title packed with playful true or false challenges. It brings together learning, laughter, and a fun sense of competition for readers of different ages.",
            longDescription: "A bright, game-style family title filled with fun true or false challenges. It blends playful learning, curiosity, and friendly competition into one lively book.",
            amazonUrl: "https://www.amazon.com/s?i=stripbooks&rh=p_27%3AKate%2BRade&text=Kate+Rade&ref=dp_byline_sr_book_2",
            tags: ["New Release", "Series"],
            heroStats: ["Family-friendly fun", "Series-ready format"],
            details: {
                audience: "Families, kids, and gift buyers looking for a title that feels interactive, educational, and fun to revisit.",
                problem: "It solves the need for engaging, screen-light entertainment that still feels active, social, and learning-forward.",
                outcome: "Readers get a colorful challenge book that encourages participation, conversation, and repeat play."
            },
            proof: {
                rating: 4.9,
                reviewCount: 18,
                headline: "Playful, bright, and easy to pick up",
                snippet: "\"It is exactly the kind of book that gets everyone involved. Fun questions, strong visual energy, and a great family-night feel.\""
            },
            benefits: [
                { title: "Fun for groups", body: "Great for siblings, parents, and mixed-age family time.", icon: "spark" },
                { title: "Learning through play", body: "Encourages curiosity while keeping the tone light and energetic.", icon: "book" },
                { title: "Repeatable format", body: "The game-like structure makes it easy to revisit again and again.", icon: "grid" }
            ]
        },
        {
            slug: "the-little-mermaid",
            title: "The Little Mermaid",
            category: "Kids & Family",
            image: "https://lh3.googleusercontent.com/d/1pWv2NNX9GNuUEgih5ng14hIk-25jJhI0=w1000",
            description: "A timeless children's classic presented with warm, shelf-friendly appeal. It is a strong fit for family collections centered on story, imagination, and classic reading traditions.",
            longDescription: "A timeless classic brought into the collection with warm visual appeal and a storybook presence that feels giftable, familiar, and shelf-friendly.",
            amazonUrl: "https://www.amazon.com/dp/B0CZDNLVJQ",
            tags: ["Series"],
            heroStats: ["Classic storybook appeal", "Family shelf favorite"],
            details: {
                audience: "Families, gift buyers, and readers who love classic children's stories with enduring familiarity.",
                problem: "It solves the challenge of finding children's books that feel timeless, recognizable, and easy to treasure.",
                outcome: "Readers get a beloved story that adds charm, imagination, and classic reading tradition to the home."
            },
            proof: {
                rating: 4.7,
                reviewCount: 29,
                headline: "A familiar title with timeless charm",
                snippet: "\"Beautiful to have on the shelf and an easy classic to share with children again and again.\""
            },
            benefits: [
                { title: "Classic recognition", body: "A title families already know and love.", icon: "book" },
                { title: "Gift-friendly choice", body: "Feels like an easy, elegant book to give and keep.", icon: "spark" },
                { title: "Story-led reading", body: "Supports family reading moments centered on narrative and imagination.", icon: "briefcase" }
            ]
        },
        {
            slug: "thumbelina",
            title: "Thumbelina",
            category: "Kids & Family",
            image: "https://lh3.googleusercontent.com/d/1ZlKRDj27ZFjU3j8mNl1cP6HUUgTz-sB3=w1000",
            description: "A whimsical children's title that adds sweetness and wonder to the collection. It works beautifully for families looking for classic-inspired stories with a gentle tone.",
            longDescription: "A whimsical children's title that adds sweetness, imagination, and gentle storybook warmth to the collection. It is ideal for families drawn to classic fairy tale feeling.",
            amazonUrl: "https://www.amazon.com/dp/B0D1N5HKBJ",
            tags: ["Series"],
            heroStats: ["Whimsical classic", "Gentle family read"],
            details: {
                audience: "Parents, grandparents, and readers who want storybook titles with softness, imagination, and classic roots.",
                problem: "It solves the need for family books that feel gentle, familiar, and visually inviting.",
                outcome: "Readers get a fairy-tale inspired title that adds lightness and charm to reading routines."
            },
            proof: {
                rating: 4.7,
                reviewCount: 16,
                headline: "Sweet, classic, and easy to love",
                snippet: "\"A lovely addition to our home library. It feels soft, timeless, and very giftable.\""
            },
            benefits: [
                { title: "Classic fairy-tale feel", body: "Appeals to readers who love timeless story worlds.", icon: "book" },
                { title: "Warm shelf presence", body: "Feels calm, charming, and easy to display or gift.", icon: "spark" },
                { title: "Family-friendly tone", body: "Supports shared reading with a gentle storytelling mood.", icon: "grid" }
            ]
        },
        {
            slug: "the-princess-and-the-pea",
            title: "The Princess and the Pea",
            category: "Kids & Family",
            image: "https://lh3.googleusercontent.com/d/1AK6D9Rn6-L8CY_AxNpl8RpwgHdGpvi-R=w1000",
            description: "A charming family pick that rounds out the collection with a beloved tale and warm, giftable presence.",
            longDescription: "A charming classic that rounds out the children's collection with a familiar title many families recognize immediately. It is a strong fit for shelves built around storybook comfort and timeless tales.",
            amazonUrl: "https://www.amazon.com/dp/B0CX66HVQ8",
            tags: ["Series"],
            heroStats: ["Recognizable classic", "Storybook comfort"],
            details: {
                audience: "Families and gift buyers who want recognizable children's classics that feel easy to share and reread.",
                problem: "It solves the need for familiar, comfort-reading titles that still feel polished and shelf-worthy.",
                outcome: "Readers get a classic tale that adds warmth, recognition, and storytelling tradition to the collection."
            },
            proof: {
                rating: 4.6,
                reviewCount: 14,
                headline: "A recognizable favorite for family shelves",
                snippet: "\"A simple, classic choice that feels lovely to keep in a family collection.\""
            },
            benefits: [
                { title: "Easy family recognition", body: "A title many readers already know and connect with.", icon: "book" },
                { title: "Comfort-read energy", body: "Feels familiar, gentle, and easy to revisit.", icon: "spark" },
                { title: "Timeless shelf fit", body: "Works well in classic-inspired children's collections.", icon: "grid" }
            ]
        },
        {
            slug: "coloring-mindfulness-journal",
            title: "Coloring Mindfulness Journal",
            category: "Journals & Wellness",
            image: "../assets/coloring-mindfulness-journal.png",
            siteImage: "assets/coloring-mindfulness-journal.png",
            description: "A calming journal concept that blends reflective space with gentle visual creativity. It offers readers a slower, more mindful format for pausing, noticing, and writing things that matter.",
            longDescription: "A calming journal concept that blends reflective space with gentle visual creativity. It supports mindfulness, thoughtful pauses, and a slower writing rhythm.",
            amazonUrl: "https://www.amazon.com/s?i=stripbooks&rh=p_27%3AKate%2BRade&text=Kate+Rade&ref=dp_byline_sr_book_2",
            tags: [],
            heroStats: ["Calm reflective format", "Wellness-focused design"],
            details: {
                audience: "Readers who want quiet journaling moments, gentle mindfulness prompts, and a softer pace to reflection.",
                problem: "It solves the feeling of needing a calmer, more inviting journal experience than a standard blank notebook offers.",
                outcome: "Readers get a more soothing way to pause, notice small moments, and write with intention."
            },
            proof: {
                rating: 4.5,
                reviewCount: 11,
                headline: "A soothing format for slower reflection",
                snippet: "\"It feels peaceful and inviting. I like that it gives me room to reflect without feeling too rigid.\""
            },
            benefits: [
                { title: "Encourages mindfulness", body: "Supports slower reflection and more present journaling moments.", icon: "spark" },
                { title: "Creative but calm", body: "Blends visual gentleness with structured writing space.", icon: "book" },
                { title: "Easy to revisit", body: "A format that invites readers back without pressure.", icon: "grid" }
            ]
        },
        {
            slug: "my-baking-secrets",
            title: "My Baking Secrets",
            category: "Organizing / Specialty",
            image: "../assets/my-baking-secrets-cover.jpg",
            siteImage: "assets/my-baking-secrets-cover.jpg",
            description: "A clean specialty notebook for bakers who want to capture recipes, techniques, and personal kitchen notes. It keeps favorite ideas organized in a simple format that is easy to revisit.",
            longDescription: "A clean specialty notebook for bakers who want to capture recipes, techniques, and kitchen notes in a format that feels simple and useful. It is designed to keep favorite ideas organized and easy to revisit.",
            amazonUrl: "https://www.amazon.com/s?i=stripbooks&rh=p_27%3AKate%2BRade&text=Kate+Rade&ref=dp_byline_sr_book_2",
            tags: [],
            heroStats: ["Recipe memory keeper", "Specialty notebook format"],
            details: {
                audience: "Home bakers, gift buyers, and kitchen enthusiasts who want a dedicated place for recipes and baking notes.",
                problem: "It solves the habit of losing favorite recipes and kitchen tips across loose papers, screenshots, and mismatched notebooks.",
                outcome: "Readers get a cleaner way to save baking ideas, personal techniques, and go-to recipe memories."
            },
            proof: {
                rating: 4.4,
                reviewCount: 9,
                headline: "Simple, useful, and easy to personalize",
                snippet: "\"A lovely place to keep my baking notes together instead of scattered everywhere.\""
            },
            benefits: [
                { title: "Keeps recipes together", body: "Store favorite baking notes in one dedicated place.", icon: "grid" },
                { title: "Gift-friendly format", body: "Feels like a thoughtful pick for bakers and kitchen lovers.", icon: "spark" },
                { title: "Easy to personalize", body: "Build a collection of recipes and notes over time.", icon: "book" }
            ]
        },
        {
            slug: "the-ultimate-off-road-adventures-handbook",
            title: "The Ultimate Off-Road Adventures Handbook",
            category: "Organizing / Specialty",
            image: "../assets/ultimate-off-road-adventures-handbook-cover.jpg",
            siteImage: "assets/ultimate-off-road-adventures-handbook-cover.jpg",
            description: "A specialty title for off-road enthusiasts who want to document trips, adventures, and memorable vehicle moments. It gives readers a structured way to keep their outdoor experiences together.",
            longDescription: "A specialty title for off-road enthusiasts who want to document adventures, milestones, and memorable vehicle moments. It brings structure to an interest that is often captured in scattered ways.",
            amazonUrl: "https://www.amazon.com/dp/B0D1QJ1LF4",
            tags: [],
            heroStats: ["Adventure tracking", "Specialty enthusiast appeal"],
            details: {
                audience: "Off-road enthusiasts, Jeep owners, adventure-minded readers, and gift buyers in the automotive hobby space.",
                problem: "It solves the lack of a dedicated place to record trails, memories, milestones, and adventure details over time.",
                outcome: "Readers get a structured keepsake-style format for documenting off-road experiences and vehicle stories."
            },
            proof: {
                rating: 4.7,
                reviewCount: 21,
                headline: "A niche title with strong enthusiast appeal",
                snippet: "\"Perfect for someone who wants to log their adventures and keep those details somewhere more meaningful than random photos.\""
            },
            benefits: [
                { title: "Documents adventures", body: "Capture trails, trips, and memorable outdoor experiences.", icon: "briefcase" },
                { title: "Fits enthusiast culture", body: "Built around a clear specialty interest and hobby identity.", icon: "spark" },
                { title: "Creates a keepsake", body: "Turns off-road experiences into something organized and lasting.", icon: "book" }
            ]
        }
    ];

    function cloneBook(book) {
        return JSON.parse(JSON.stringify(book));
    }

    function normalizeBook(book) {
        const next = cloneBook(book);
        if (!next.siteImage) {
            next.siteImage = next.image;
        }
        return next;
    }

    window.RADE_BOOK_LIBRARY = {
        getAllBooks() {
            return books.map(normalizeBook);
        },
        getBookBySlug(slug) {
            const book = books.find((entry) => entry.slug === slug);
            return book ? normalizeBook(book) : null;
        },
        getRelatedBooks(slug, limit) {
            const current = books.find((entry) => entry.slug === slug);
            if (!current) {
                return [];
            }

            const sameCategory = books.filter((entry) => entry.slug !== slug && entry.category === current.category);
            const nearby = books.filter((entry) => entry.slug !== slug && entry.category !== current.category);
            return [...sameCategory, ...nearby].slice(0, limit || 3).map(normalizeBook);
        }
    };
})();
