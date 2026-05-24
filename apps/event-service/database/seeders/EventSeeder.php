<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Seat;
use App\Models\SeatSection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $events = [
            [
                'title'       => 'Rock in Rio 2026',
                'description' => 'O maior festival de música do mundo de volta ao Brasil. Artistas internacionais, shows imperdíveis e muita energia.',
                'venue'       => 'Cidade do Rock',
                'city'        => 'Rio de Janeiro',
                'category'    => 'Shows',
                'date_from'   => '2026-09-26 20:00:00',
                'date_to'     => '2026-09-26 23:59:00',
                'gates_open'  => '2026-09-26 16:00:00',
                'min_price'   => 250.00,
                'image_url'   => 'https://images.unsplash.com/photo-1540039155521-cbddb3c3e3a0?w=800&q=80',
                'published'   => true,
                'sections'    => [
                    ['name' => 'Pista',     'capacity' => 200, 'price' => 250.00],
                    ['name' => 'Cadeira',   'capacity' => 100, 'price' => 450.00],
                    ['name' => 'Camarote',  'capacity' => 30,  'price' => 950.00],
                ],
            ],
            [
                'title'       => 'Coldplay — Music of the Spheres Tour',
                'description' => 'A turnê mais sustentável do mundo chega ao Brasil com um show visual e musical inesquecível.',
                'venue'       => 'Estádio do Morumbi',
                'city'        => 'São Paulo',
                'category'    => 'Shows',
                'date_from'   => '2026-10-15 21:00:00',
                'date_to'     => '2026-10-16 00:30:00',
                'gates_open'  => '2026-10-15 18:00:00',
                'min_price'   => 320.00,
                'image_url'   => 'https://images.unsplash.com/photo-1501281668745-1dbacc5a3c64?w=800&q=80',
                'published'   => true,
                'sections'    => [
                    ['name' => 'Pista Premium', 'capacity' => 150, 'price' => 520.00],
                    ['name' => 'Pista',         'capacity' => 300, 'price' => 320.00],
                    ['name' => 'Arquibancada',   'capacity' => 200, 'price' => 180.00],
                ],
            ],
            [
                'title'       => 'Lollapalooza Brasil 2026',
                'description' => 'Três dias de festival com o melhor do pop, rock e eletrônico no Autódromo de Interlagos.',
                'venue'       => 'Autódromo de Interlagos',
                'city'        => 'São Paulo',
                'category'    => 'Shows',
                'date_from'   => '2026-06-28 12:00:00',
                'date_to'     => '2026-06-30 23:59:00',
                'gates_open'  => '2026-06-28 11:00:00',
                'min_price'   => 490.00,
                'image_url'   => 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
                'published'   => true,
                'sections'    => [
                    ['name' => 'Passe 3 Dias', 'capacity' => 500, 'price' => 490.00],
                    ['name' => 'VIP 3 Dias',   'capacity' => 100, 'price' => 1200.00],
                ],
            ],
            [
                'title'       => 'Hamilton — O Musical',
                'description' => 'O premiado musical da Broadway sobre Alexander Hamilton chega ao Brasil com produção original.',
                'venue'       => 'Teatro Bradesco',
                'city'        => 'São Paulo',
                'category'    => 'Teatro',
                'date_from'   => '2026-07-10 20:00:00',
                'date_to'     => '2026-07-10 23:00:00',
                'gates_open'  => '2026-07-10 19:30:00',
                'min_price'   => 120.00,
                'image_url'   => 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80',
                'published'   => true,
                'sections'    => [
                    ['name' => 'Plateia A', 'capacity' => 80,  'price' => 280.00],
                    ['name' => 'Plateia B', 'capacity' => 120, 'price' => 180.00],
                    ['name' => 'Balcão',    'capacity' => 60,  'price' => 120.00],
                ],
            ],
            [
                'title'       => 'Hamlet — William Shakespeare',
                'description' => 'A clássica peça de Shakespeare encenada pelo grupo Galpão com direção premiada.',
                'venue'       => 'Teatro Municipal',
                'city'        => 'Belo Horizonte',
                'category'    => 'Teatro',
                'date_from'   => '2026-08-05 19:30:00',
                'date_to'     => '2026-08-05 22:30:00',
                'gates_open'  => '2026-08-05 19:00:00',
                'min_price'   => 60.00,
                'image_url'   => 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
                'published'   => true,
                'sections'    => [
                    ['name' => 'Plateia', 'capacity' => 200, 'price' => 90.00],
                    ['name' => 'Balcão',  'capacity' => 80,  'price' => 60.00],
                ],
            ],
            [
                'title'       => 'Flamengo x Botafogo — Clássico Carioca',
                'description' => 'O maior clássico do futebol carioca no estádio mais icônico do Brasil.',
                'venue'       => 'Maracanã',
                'city'        => 'Rio de Janeiro',
                'category'    => 'Esportes',
                'date_from'   => '2026-06-21 16:00:00',
                'date_to'     => '2026-06-21 18:00:00',
                'gates_open'  => '2026-06-21 14:00:00',
                'min_price'   => 80.00,
                'image_url'   => 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
                'published'   => true,
                'sections'    => [
                    ['name' => 'Setor Norte',  'capacity' => 300, 'price' => 80.00],
                    ['name' => 'Setor Sul',    'capacity' => 300, 'price' => 80.00],
                    ['name' => 'Cadeiras',     'capacity' => 150, 'price' => 180.00],
                    ['name' => 'Camarote VIP', 'capacity' => 40,  'price' => 450.00],
                ],
            ],
            [
                'title'       => 'UFC 320 — Brasil',
                'description' => 'O UFC volta ao Brasil com um card histórico recheado de brasileiros e disputas de cinturão.',
                'venue'       => 'Ginásio do Ibirapuera',
                'city'        => 'São Paulo',
                'category'    => 'Esportes',
                'date_from'   => '2026-11-07 19:00:00',
                'date_to'     => '2026-11-08 01:00:00',
                'gates_open'  => '2026-11-07 17:00:00',
                'min_price'   => 150.00,
                'image_url'   => 'https://images.unsplash.com/photo-1547941126-3d5322b218b0?w=800&q=80',
                'published'   => true,
                'sections'    => [
                    ['name' => 'Arena',    'capacity' => 200, 'price' => 150.00],
                    ['name' => 'Ringside', 'capacity' => 50,  'price' => 800.00],
                ],
            ],
            [
                'title'       => 'Festival de Stand-up — Edição Especial',
                'description' => 'Cinco dias de humor com os maiores nomes do stand-up nacional em formato festival.',
                'venue'       => 'Espaço das Américas',
                'city'        => 'São Paulo',
                'category'    => 'Stand-up',
                'date_from'   => '2026-07-30 20:00:00',
                'date_to'     => '2026-07-30 23:00:00',
                'gates_open'  => '2026-07-30 19:30:00',
                'min_price'   => 70.00,
                'image_url'   => 'https://images.unsplash.com/photo-1585951237318-9ea5e175b891?w=800&q=80',
                'published'   => true,
                'sections'    => [
                    ['name' => 'Pista',   'capacity' => 300, 'price' => 70.00],
                    ['name' => 'Premium', 'capacity' => 80,  'price' => 140.00],
                ],
            ],
            [
                'title'       => 'Porta dos Fundos — Live Show',
                'description' => 'O grupo mais famoso do humor brasileiro faz sua turnê especial com sketches inéditos ao vivo.',
                'venue'       => 'Via Funchal',
                'city'        => 'São Paulo',
                'category'    => 'Stand-up',
                'date_from'   => '2026-09-12 21:00:00',
                'date_to'     => '2026-09-12 23:30:00',
                'gates_open'  => '2026-09-12 20:00:00',
                'min_price'   => 90.00,
                'image_url'   => 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80',
                'published'   => true,
                'sections'    => [
                    ['name' => 'Pista',  'capacity' => 250, 'price' => 90.00],
                    ['name' => 'Lounge', 'capacity' => 60,  'price' => 200.00],
                ],
            ],
            [
                'title'       => 'Gusttavo Lima — Balada dos Namorados',
                'description' => 'O Embaixador em show especial para o dia dos namorados com repertório romântico e hits.',
                'venue'       => 'Arena Anhembi',
                'city'        => 'São Paulo',
                'category'    => 'Shows',
                'date_from'   => '2026-06-12 22:00:00',
                'date_to'     => '2026-06-13 02:00:00',
                'gates_open'  => '2026-06-12 20:00:00',
                'min_price'   => 180.00,
                'image_url'   => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
                'published'   => true,
                'sections'    => [
                    ['name' => 'Pista',    'capacity' => 400, 'price' => 180.00],
                    ['name' => 'Camarote', 'capacity' => 60,  'price' => 500.00],
                ],
            ],
        ];

        foreach ($events as $eventData) {
            $sections = $eventData['sections'];
            unset($eventData['sections']);

            $event = DB::transaction(function () use ($eventData, $sections) {
                $event = Event::create($eventData);

                foreach ($sections as $sectionData) {
                    $section = SeatSection::create([
                        'event_id' => $event->id,
                        'name'     => $sectionData['name'],
                        'capacity' => $sectionData['capacity'],
                        'price'    => $sectionData['price'],
                    ]);

                    $seats = [];
                    for ($i = 1; $i <= $sectionData['capacity']; $i++) {
                        $seats[] = [
                            'id'         => (string) Str::uuid(),
                            'event_id'   => $event->id,
                            'section_id' => $section->id,
                            'label'      => "{$sectionData['name']}-{$i}",
                            'status'     => 'available',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }

                    // Inserção em chunks para não estourar o limite de bind parameters
                    foreach (array_chunk($seats, 500) as $chunk) {
                        Seat::insert($chunk);
                    }
                }

                return $event;
            });

            $this->command->info("✓ {$event->title} ({$event->city})");
        }
    }
}
