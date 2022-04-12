import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromFetchStream } from '../fromFetchStream';
import { Observable, Subject } from 'rxjs';
import { finalize, scan, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-fetch-data',
  templateUrl: './fetch-data.component.html'
})
export class FetchDataComponent {
  public forecasts$: Observable<WeatherForecast[]>;
  public loading = true;

  private stopSource = new Subject();

  constructor(@Inject('BASE_URL') baseUrl: string) {
    this.forecasts$ = fromFetchStream<WeatherForecast>(baseUrl + 'weatherforecast').pipe(
      takeUntil(this.stopSource),
      scan((all, item) => [...all, item], [] as WeatherForecast[]),
      finalize(() => this.loading = false)
    );
  }

  public stop() {
    this.stopSource.next();
  }
}

interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
}
