<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasUuids;

    protected $fillable = [
        'title', 'description', 'venue', 'city', 'category',
        'date_from', 'date_to', 'gates_open', 'min_price',
        'image_url', 'published',
    ];

    protected $casts = [
        'date_from'   => 'datetime',
        'date_to'     => 'datetime',
        'gates_open'  => 'datetime',
        'min_price'   => 'decimal:2',
        'published'   => 'boolean',
    ];

    public function seatSections(): HasMany
    {
        return $this->hasMany(SeatSection::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class);
    }


}
