<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use OpenTelemetry\API\Globals;
use OpenTelemetry\Contrib\Otlp\OtlpHttpTransportFactory;
use OpenTelemetry\Contrib\Otlp\SpanExporter;
use OpenTelemetry\SDK\Common\Attribute\Attributes;
use OpenTelemetry\SDK\Resource\ResourceInfo;
use OpenTelemetry\SDK\Trace\Sampler\AlwaysOnSampler;
use OpenTelemetry\SDK\Trace\SpanProcessor\SimpleSpanProcessor;
use OpenTelemetry\SDK\Trace\TracerProvider;
use OpenTelemetry\SemConv\ResourceAttributes;

class TelemetryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $endpoint = env('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
        $service  = env('OTEL_SERVICE_NAME', 'event-service');

        $resource = ResourceInfo::create(Attributes::create([
            ResourceAttributes::SERVICE_NAME => $service,
        ]));

        $transport = (new OtlpHttpTransportFactory())->create(
            "{$endpoint}/v1/traces",
            'application/x-protobuf'
        );

        $exporter = new SpanExporter($transport);

        $tracerProvider = new TracerProvider(
            spanProcessors: [new SimpleSpanProcessor($exporter)],
            sampler: new AlwaysOnSampler(),
            resource: $resource,
        );

        Globals::registerInitializer(function () use ($tracerProvider) {
            return \OpenTelemetry\SDK\SdkBuilder::create()
                ->setTracerProvider($tracerProvider)
                ->buildAndRegisterGlobal();
        });

        $this->app->singleton('tracer', fn () => $tracerProvider->getTracer($service));
    }
}
