<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SeatSection extends Model
{
    use HasUuids;

    protected $fillable = ['event_id', 'name', 'capacity', 'price'];

    protected $casts = [
        'price'    => 'decimal:2',
        'capacity' => 'integer',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class, 'section_id');
    }
}
