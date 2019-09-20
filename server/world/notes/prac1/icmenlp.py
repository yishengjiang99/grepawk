"""
file: icmenlp.py
description: Utilities for the ICME summer workshop on Deep Learning for NLP
copyright: 2018 Luke de Oliveira, MIT Licensed.
date: August 17th, 2018
"""

import json

import keras
import numpy as np
from sklearn.base import TransformerMixin
from sklearn.model_selection import train_test_split


def load_data(path, source='assistant', splits=(70, 10, 20)):
    """
    Loads data type specified from the file passed in.

    Args:
        path (Path): A path to a file (json) to load from.
        source (str): One of 'assistant' or 'sentiment'
        splits (tuple): A length-3 tuple containing the training split size,
            val split size, and testing split size respectively.

    Returns:
        Dict: A dictionary with keys 'train', 'val', and 'test', holding each
            respective set.

    Raises:
        ValueError: If you do not pass in a tuple of length three into splits.
    """
    if not len(splits) == 3:
        raise ValueError('splits expected to have three components: found {}'
                         .format(len(splits)))
    train_size, test_size, val_size = np.array(splits) / np.sum(splits)

    data = json.load(open(path))
    if source == 'assistant':
        # Split into training set & (test + val) set.
        data_train, data_test = train_test_split(
            data, train_size=train_size
        )
        # Now, the (test + val) set into the test, and val sets
        data_test, data_val = train_test_split(
            data_test,
            test_size=(val_size / (val_size + test_size))
        )
        data = {
            'train': data_train,
            'test': data_test,
            'val': data_val
        }
    elif source == 'sentiment':
        text, label = data['text'], data['label']

        # Split into training set & (test + val) set.
        text_train, text_test, label_train, label_test = train_test_split(
            text, label,
            train_size=train_size
        )
        # Now, the (test + val) set into the test, and val sets
        text_test, text_val, label_test, label_val = train_test_split(
            text_test, label_test,
            test_size=(val_size / (val_size + test_size))
        )
        data = {
            'train': (text_train, label_train),
            'test': (text_test, label_test),
            'val': (text_val, label_val)
        }
    else:
        raise ValueError('Invalid source: {}'.format(source))
    return data


class VocabularyContainer(TransformerMixin):

    PAD_TOKEN = '<PAD>'
    UNK_TOKEN = '<UNK>'
    START_TOKEN = '<S>'
    END_TOKEN = '</S>'

    def __init__(self, tokenizer=None):
        """Create a new VocabularyContainer object that will hold a stateful,
        fittable vocabulary.

        Args:
            tokenizer (Callable): A function that maps an object into a list of
                strings. By default, this will split tokens based on spaces.
        """
        self.tokenizer = tokenizer or (lambda x: x.split(' '))
        self._word2index = {
            self.PAD_TOKEN: 0,
            self.UNK_TOKEN: 1,
            self.START_TOKEN: 2,
            self.END_TOKEN: 3,
        }
        self._index2word = {}

    def fit(self, documents):
        """Fits the vocab on a set of documents.

        Will apply the tokenizer specified in the constructor to each document
        to extract the tokens.

        Args:
            documents (List[str]): Documents to tokenize and then use as the
                vocabulary.

        Returns:
            self
        """
        # Get a list of all the unique tokens that appear
        vocab = list({
            token for doc in documents
            for token in self.tokenizer(doc)
            if token not in self._word2index
        })

        # This is UNK, START, END, and PAD.
        nb_special_tokens = 4

        # First, we map token -> ID, leaving the first slots for special tokens
        self._word2index.update({
            word: idx
            for idx, word in enumerate(vocab, nb_special_tokens)
        })

        # Next, we invert this map, which we can do since it was built from
        # unique vocabulary elements and is by definition bijective.
        self._index2word.update({
            idx: word
            for word, idx in self._word2index.items()
        })

        return self

    @property
    def vocab_size(self):
        return len(self._word2index)

    def _to_indices(self, obj):
        # Recursively converts iterables of strings to iterables of integers
        if isinstance(obj, str):
            return self._word2index.get(obj, self._word2index[self.UNK_TOKEN])
        return [self._to_indices(o) for o in obj]

    def _to_words(self, obj):
        # Recursively converts iterables of integers to iterables of strings
        if isinstance(obj, int):
            return self._index2word.get(obj, self.UNK_TOKEN)
        return [self._to_words(o) for o in obj]

    def process_text(self, text, add_start=False, add_end=False):
        """Converts a single document/text into a integer representation.

        Args:
            text (str): Document to convert to it's integer representation.
            add_start (bool): Whether or not to add the START token <S> to the
                document or not.
            add_end (bool): Whether or not to add the END token </S> to the
                document or not.

        Returns:
            List[int]: integer representations for each token in the tokenized
                version of the passed in text.
        """
        text = self.tokenizer(text)
        indices = self._to_indices(text)

        if add_start:
            indices = [self._to_indices(self.START_TOKEN)] + indices

        if add_end:
            indices = indices + [self._to_indices(self.END_TOKEN)]

        return indices

    def transform(self, documents, pad_length=None, add_start=False,
                  add_end=False):
        """Transforms a series of documents into a list of equal length lists
        of integers (each sublist is a tokenized document in integer
        representation form).

        Args:
            documents (List[str]): List of documents to transform.
            pad_length (int): Length to pad documents to.
            add_start (bool): Whether or not to add the START token <S> to the
                document or not.
            add_end (bool): Whether or not to add the END token </S> to the
                document or not.

        Returns:
            List[List[int]]: integer representations for each token in the
                tokenized version of the passed in text.
        """
        indices = [
            self.process_text(text=doc, add_start=add_start, add_end=add_end)
            for doc in documents
        ]
        if pad_length:
            if pad_length == 'max':
                pad_length = max(map(len, indices))
            indices = keras.preprocessing.sequence.pad_sequences(
                sequences=indices,
                maxlen=pad_length,
                dtype=int,
                padding='pre',
                truncating='pre'
            ).tolist()
        return indices

    def inverse_transform(self, indices):
        """Takes a sequence of integers and maps back into tokens."""
        return self._to_words(obj=indices)
