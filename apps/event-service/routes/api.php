<?php

use App\Http\Controllers\EventController;
use App\Http\Middleware\RequireAdminRole;
use Illuminate\Support\Facades\Route;

Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);

Route::middleware(RequireAdminRole::class)->group(function () {
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    Route::post('/events/{id}/image', [EventController::class, 'uploadImage']);
});
