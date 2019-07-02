// Angular
import { Injectable } from "@angular/core";
// store
import { Effect, Actions, ofType } from "@ngrx/effects";
import { combineLatest, of, zip } from "rxjs";
import { catchError, filter, map, switchMap, withLatestFrom }
  from "rxjs/operators";
import { Store } from "@ngrx/store";
import * as pairwiseBlocksActions from "../actions/pairwise-blocks.actions";
import * as fromRoot from "../reducers";
import * as fromChromosome from "../reducers/chromosome.reducer";
import * as fromPairwiseBlocks from "../reducers/pairwise-blocks.reducer";
import * as fromRouter from "../reducers/router.store";
// app
import { PairwiseBlocksService } from "../../services";

@Injectable()
export class PairwiseBlocksEffects {

  constructor(private actions$: Actions,
              private pairwiseBlocksService: PairwiseBlocksService,
              private store: Store<fromRoot.State>) { }

  // clear the store every time new parameters are emitted and get new blocks
  @Effect()
  clearBlocks$ = this.store.select(fromRouter.getMacroBlockParams).pipe(
    withLatestFrom(
      this.store.select(fromChromosome.getSelectedChromosomes),
      this.store.select(fromRouter.getMicroQueryParamSources)),
    switchMap(([params, chromosomes, sources]) => {
      const clear = new pairwiseBlocksActions.Clear();
      const actions: pairwiseBlocksActions.Actions[] = [clear];
      chromosomes.forEach((chromosome) => {
        sources.forEach((source) => {
          const payload = {params, chromosome, source};
          const action = new pairwiseBlocksActions.Get(payload);
          actions.push(action);
        });
      });
      return actions;
    }),
  );

  // gets blocks for selected chromosomes from selected sources
  @Effect()
  blocks4chromosomes$ = combineLatest(
    this.store.select(fromChromosome.getSelectedChromosomes),
    this.store.select(fromRouter.getMicroQueryParamSources),
    this.store.select(fromPairwiseBlocks.getLoading),
    this.store.select(fromPairwiseBlocks.getLoaded),
  ).pipe(
    withLatestFrom(this.store.select(fromRouter.getMacroBlockParams)),
    // TODO: will switchMap cancel the previous request as chromosomes are loaded?
    switchMap(([[chromosomes, sources, loading, loaded], params]) => {
      const join = (...args) => args.join(":");
      const id2string = (id) => {
          return join(id.reference, id.referenceSource, id.source);
        };
      const loadingIDs = new Set(loading.map(id2string));
      const loadedIDs = new Set(loaded.map(id2string));
      const actions: pairwiseBlocksActions.Actions[] = [];
      chromosomes.forEach((chromosome) => {
        sources.forEach((source) => {
          const id = join(chromosome.name, chromosome.source, source);
          if (!loadingIDs.has(id) && !loadedIDs.has(id)) {
            const payload = {chromosome, params, source};
            const action = new pairwiseBlocksActions.Get(payload);
            actions.push(action);
          }
        });
      });
      return actions;
    }),
  );

  // get pairwise blocks via the pairwise blocks service
  @Effect()
  getPairwiseBlocks$ = this.actions$.pipe(
    ofType(pairwiseBlocksActions.GET),
    map((action: pairwiseBlocksActions.Get) => action.payload),
    // TODO: is the switchMap going to cancel in flight requests we want to keep?
    switchMap(({chromosome, source, params}) => {
      return this.pairwiseBlocksService
      .getPairwiseBlocks(chromosome, params, source).pipe(
        map((blocks) => {
          const payload = {chromosome, source, blocks};
          return new pairwiseBlocksActions.GetSuccess(payload);
        }),
        catchError((error) => {
          const payload = {chromosome, source};
          return of(new pairwiseBlocksActions.GetFailure(payload));
        })
      );
    })
  );

}
