import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { destination, start_date, end_date, preferences } = await req.json();

    const start = new Date(start_date);
    const end = new Date(end_date);
    const numDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const pace = preferences?.pace || "moderate";
    const interests: string[] = preferences?.interests || [];
    const activitiesPerDay = pace === "relaxed" ? 3 : pace === "packed" ? 6 : 4;

    const prompt = `Generate a detailed ${numDays}-day travel itinerary for ${destination}.
Trip pace: ${pace} (approximately ${activitiesPerDay} activities per day)
Traveler interests: ${interests.length > 0 ? interests.join(", ") : "general sightseeing, culture, food"}
Trip dates: ${start_date} to ${end_date}

Return ONLY a valid JSON object with this exact structure, no markdown:
{
  "days": [
    {
      "day_number": 1,
      "title": "Descriptive day title",
      "activities": [
        {
          "name": "Activity name",
          "start_time": "09:00",
          "duration_minutes": 90,
          "description": "Engaging 1-2 sentence description of the activity",
          "location_text": "Specific venue/address in ${destination}"
        }
      ]
    }
  ]
}

Rules:
- Make activities specific and authentic to ${destination}
- Include meals (breakfast, lunch, dinner) at local restaurants
- Times in HH:MM 24h format, spaced realistically
- Titles should be evocative like "Golden Hour at the Harbor" or "Street Food & Night Markets"
- Vary activity types based on interests: ${interests.join(", ")}
- Ensure activities flow logically by location to minimize travel time`;

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      const mockDays = Array.from({ length: numDays }, (_, i) => {
        const dayDate = new Date(start);
        dayDate.setDate(dayDate.getDate() + i);
        const dayTitles = [
          "Arrival & First Impressions",
          "Iconic Landmarks & Local Flavors",
          "Hidden Gems & Cultural Immersion",
          "Nature, Art & Evening Delights",
          "Markets, Museums & Farewell Dinner",
          "Leisure Morning & Departure",
        ];
        return {
          day_number: i + 1,
          title: dayTitles[i % dayTitles.length],
          activities: [
            {
              name: i === 0 ? "Hotel Check-in & Freshen Up" : "Breakfast at a Local Café",
              start_time: "09:00",
              duration_minutes: 60,
              description: i === 0
                ? `Settle into your accommodation and get oriented in ${destination}.`
                : `Start the day with a fresh breakfast and coffee at a beloved neighborhood café.`,
              location_text: `${destination} City Center`,
            },
            {
              name: interests.includes("culture") ? "Museum or Historic Site Visit" : "Scenic City Walk",
              start_time: "10:30",
              duration_minutes: 120,
              description: `Explore one of ${destination}'s most celebrated attractions, rich with history and local character.`,
              location_text: `Main Cultural District, ${destination}`,
            },
            {
              name: "Lunch at a Renowned Local Restaurant",
              start_time: "13:00",
              duration_minutes: 90,
              description: `Savor authentic dishes that ${destination} is famous for, paired with local beverages.`,
              location_text: `Restaurant Quarter, ${destination}`,
            },
            {
              name: interests.includes("nature") ? "Park or Waterfront Stroll" : "Shopping & Souvenir Hunt",
              start_time: "15:00",
              duration_minutes: 120,
              description: `Spend the afternoon enjoying the relaxed pace and beauty of ${destination}'s ${interests.includes("nature") ? "natural landscapes" : "vibrant shopping streets"}.`,
              location_text: `${destination} Waterfront`,
            },
            {
              name: interests.includes("food") ? "Street Food Tour" : "Sunset Viewpoint",
              start_time: "18:00",
              duration_minutes: 90,
              description: `Experience the best of ${destination}'s ${interests.includes("food") ? "street food scene with local vendors" : "panoramic views as the sun sets"}.`,
              location_text: `Old Town, ${destination}`,
            },
            {
              name: interests.includes("nightlife") ? "Cocktail Bar & Nightlife" : "Dinner at Rooftop Restaurant",
              start_time: "20:00",
              duration_minutes: 120,
              description: `Cap the evening with ${interests.includes("nightlife") ? "vibrant local nightlife and craft cocktails" : "an elegant dinner with sweeping views of the city"}.`,
              location_text: `Evening District, ${destination}`,
            },
          ].slice(0, activitiesPerDay),
        };
      });

      return new Response(JSON.stringify({ days: mockDays }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert travel planner. Always respond with valid JSON only, no markdown fences or extra text.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const itinerary = JSON.parse(content);

    return new Response(JSON.stringify(itinerary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
