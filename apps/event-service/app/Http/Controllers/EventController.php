<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class EventController extends Controller
{
    private const CACHE_TTL = 300; // 5 minutes

    // GET /events?page=1&limit=20&category=&city=
    public function index(Request $request): JsonResponse
    {
        $page     = max(1, (int) $request->query('page', 1));
        $limit    = min(100, max(1, (int) $request->query('limit', 20)));
        $category = $request->query('category');
        $city     = $request->query('city');

        $cacheKey = "events:list:{$page}:{$limit}:{$category}:{$city}";

        $result = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($page, $limit, $category, $city) {
            $query = Event::query()
                ->where('published', true)
                ->where('date_from', '>', now())
                ->orderBy('date_from');

            if ($category) {
                $query->where('category', $category);
            }
            if ($city) {
                $query->where('city', $city);
            }

            $paginator = $query->paginate($limit, ['*'], 'page', $page);

            return [
                'data'  => $paginator->map(fn ($e) => $e->toArray())->all(),
                'total' => $paginator->total(),
                'page'  => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'pages' => $paginator->lastPage(),
            ];
        });

        return response()->json($result);
    }

    // GET /events/:id
    public function show(string $id): JsonResponse
    {
        $cacheKey = "events:detail:{$id}";

        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($id) {
            $event = Event::with(['seatSections.seats'])
                ->where('published', true)
                ->find($id);

            if (! $event) {
                return null;
            }

            $data = $event->toArray();
            $data['available_seats'] = $event->seats()->where('status', 'available')->count();
            return $data;
        });

        if (! $data) {
            return response()->json(['message' => 'Event not found'], 404);
        }

        return response()->json($data);
    }

    // POST /events (admin)
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string',
            'venue'         => 'required|string|max:255',
            'city'          => 'required|string|max:255',
            'category'      => 'required|string|max:100',
            'date_from'     => 'required|date',
            'date_to'       => 'required|date|after:date_from',
            'gates_open'    => 'nullable|date',
            'published'     => 'boolean',
            'seat_sections' => 'required|array|min:1',
            'seat_sections.*.name'     => 'required|string',
            'seat_sections.*.capacity' => 'required|integer|min:1',
            'seat_sections.*.price'    => 'required|numeric|min:0',
        ]);

        $event = DB::transaction(function () use ($validated) {
            $event = Event::create([
                'title'       => $validated['title'],
                'description' => $validated['description'] ?? null,
                'venue'       => $validated['venue'],
                'city'        => $validated['city'],
                'category'    => $validated['category'],
                'date_from'   => $validated['date_from'],
                'date_to'     => $validated['date_to'],
                'gates_open'  => $validated['gates_open'] ?? null,
                'published'   => $validated['published'] ?? false,
                'min_price'   => collect($validated['seat_sections'])->min('price'),
            ]);

            foreach ($validated['seat_sections'] as $sectionData) {
                $section = $event->seatSections()->create([
                    'name'     => $sectionData['name'],
                    'capacity' => $sectionData['capacity'],
                    'price'    => $sectionData['price'],
                ]);

                $seats = [];
                for ($i = 1; $i <= $sectionData['capacity']; $i++) {
                    $seats[] = [
                        'id'         => (string) \Illuminate\Support\Str::uuid(),
                        'event_id'   => $event->id,
                        'section_id' => $section->id,
                        'label'      => "{$sectionData['name']}-{$i}",
                        'status'     => 'available',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                \App\Models\Seat::insert($seats);
            }

            return $event->load('seatSections');
        });

        return response()->json($event, 201);
    }

    private function clearEventCaches(string $id): void
    {
        Cache::forget("events:detail:{$id}");

        $prefix = config('cache.prefix');
        $keys = \Illuminate\Support\Facades\Redis::keys("{$prefix}:events:list:*");
        if ($keys) {
            \Illuminate\Support\Facades\Redis::del($keys);
        }
    }

    // PUT /events/:id (admin)
    public function update(Request $request, string $id): JsonResponse
    {
        $event = Event::find($id);
        if (! $event) {
            return response()->json(['message' => 'Event not found'], 404);
        }

        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'venue'       => 'sometimes|string|max:255',
            'city'        => 'sometimes|string|max:255',
            'category'    => 'sometimes|string|max:100',
            'date_from'   => 'sometimes|date',
            'date_to'     => 'sometimes|date',
            'gates_open'  => 'nullable|date',
            'published'   => 'boolean',
        ]);

        $event->update($validated);

        $this->clearEventCaches($id);

        return response()->json($event->fresh('seatSections'));
    }

    // DELETE /events/:id (admin)
    public function destroy(string $id): JsonResponse
    {
        $event = Event::find($id);
        if (! $event) {
            return response()->json(['message' => 'Event not found'], 404);
        }

        $event->delete();

        $this->clearEventCaches($id);

        return response()->json(null, 204);
    }

    // POST /events/:id/image (admin)
    public function uploadImage(Request $request, string $id): JsonResponse
    {
        $event = Event::find($id);
        if (! $event) {
            return response()->json(['message' => 'Event not found'], 404);
        }

        $request->validate(['image' => 'required|image|max:5120']);

        $path = Storage::disk('s3')->putFile("events/{$id}", $request->file('image'), 'public');
        $url  = Storage::disk('s3')->url($path);

        $event->update(['image_url' => $url]);
        $this->clearEventCaches($id);

        return response()->json(['image_url' => $url]);
    }

}
