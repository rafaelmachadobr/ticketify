<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\SeatSection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class EventCacheTest extends TestCase
{
    use RefreshDatabase;

    private function makeEvent(array $overrides = []): Event
    {
        $event = Event::create(array_merge([
            'title'     => 'Test Event',
            'venue'     => 'Arena Test',
            'city'      => 'São Paulo',
            'category'  => 'Shows',
            'date_from' => now()->addDays(10),
            'date_to'   => now()->addDays(10)->addHours(3),
            'min_price' => 50.00,
            'published' => true,
        ], $overrides));

        SeatSection::create([
            'event_id' => $event->id,
            'name'     => 'Pista',
            'capacity' => 100,
            'price'    => 50.00,
        ]);

        return $event;
    }

    public function test_list_populates_cache_on_miss(): void
    {
        $this->makeEvent();

        Cache::flush();

        $this->getJson('/api/events')->assertOk();

        $this->assertTrue(Cache::has('events:list:1:20::'));
    }

    public function test_list_serves_from_cache_on_hit(): void
    {
        $this->makeEvent();

        // Primeira requisição: popula cache
        $first = $this->getJson('/api/events')->assertOk()->json('data');

        // Insere evento diretamente no banco sem invalidar cache
        Event::create([
            'title'     => 'Evento Novo Sem Cache',
            'venue'     => 'Local',
            'city'      => 'RJ',
            'category'  => 'Teatro',
            'date_from' => now()->addDays(5),
            'date_to'   => now()->addDays(5)->addHours(2),
            'min_price' => 30.00,
            'published' => true,
        ]);

        // Segunda requisição: deve retornar dados do cache (sem o novo evento)
        $second = $this->getJson('/api/events')->assertOk()->json('data');

        $this->assertCount(count($first), $second);
    }

    public function test_detail_populates_cache_on_miss(): void
    {
        $event = $this->makeEvent();
        Cache::flush();

        $this->getJson("/api/events/{$event->id}")->assertOk();

        $this->assertTrue(Cache::has("events:detail:{$event->id}"));
    }

    public function test_update_invalidates_detail_cache(): void
    {
        $event = $this->makeEvent();

        // Popula cache
        $this->getJson("/api/events/{$event->id}")->assertOk();
        $this->assertTrue(Cache::has("events:detail:{$event->id}"));

        // Atualiza (simulando header admin)
        $this->withHeaders(['X-User-Role' => 'admin'])
            ->putJson("/api/events/{$event->id}", ['title' => 'Título Atualizado'])
            ->assertOk();

        // Cache deve ter sido invalidado
        $this->assertFalse(Cache::has("events:detail:{$event->id}"));
    }

    public function test_detail_returns_updated_data_after_invalidation(): void
    {
        $event = $this->makeEvent();

        $this->withHeaders(['X-User-Role' => 'admin'])
            ->putJson("/api/events/{$event->id}", ['title' => 'Novo Título'])
            ->assertOk();

        $response = $this->getJson("/api/events/{$event->id}")->assertOk();

        $this->assertEquals('Novo Título', $response->json('title'));
    }

    public function test_show_returns_404_for_unknown_id(): void
    {
        $this->getJson('/api/events/00000000-0000-0000-0000-000000000000')
            ->assertNotFound();
    }
}
