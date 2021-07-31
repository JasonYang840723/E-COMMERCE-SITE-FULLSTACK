import React, { Fragment, useEffect, useState } from 'react';
import Pagination from 'react-js-pagination';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import MetaData from '../layout/MetaData';
import Product from './Product';
import Loader from '../layout/Loader';

import { useDispatch, useSelector } from 'react-redux';
import { useAlert } from 'react-alert';
import { getProducts } from '../../store/actions/product-actions';

const { createSliderWithTooltip } = Slider;
const Range = createSliderWithTooltip(Slider.Range);

const Category = ({ match, history }) => {
  const categoryHeader = match.params.category.replace(/%2F/g, '/');
  const [currentPage, setCurrentPage] = useState(1);
  const [price, setPrice] = useState([1, 1000]);
  const [category, setCategory] = useState(match.params.category);
  const [rating, setRating] = useState(0);
  const keyword = '';

  const categories = [
    'Electronics',
    'Cameras',
    'Laptops',
    'Accessories',
    'Headphones',
    'Food',
    'Books',
    'Clothes/Shoes',
    'Beauty/Health',
    'Sports',
    'Outdoor',
    'Home',
  ];

  const { loading, products, error, productsCount, resPerPage, filteredProductsCount } = useSelector(
    (state) => state.product
  );

  const alert = useAlert();
  const dispatch = useDispatch();

  useEffect(() => {
    if (error) {
      return alert.error(error);
    }

    dispatch(getProducts(keyword, currentPage, price, category, rating));
  }, [dispatch, alert, error, keyword, currentPage, price, category, rating]);

  const setCurrentPageNo = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const clickCategoryHandler = (category) => {
    const categoryURLencoded = category.replace(/\//g, '%2F');
    history.push(`/category/${categoryURLencoded}`);
    setCategory(category);
  };

  let count = productsCount;
  if (category) {
    count = filteredProductsCount;
  }
  return (
    <Fragment>
      {loading ? (
        <Loader />
      ) : (
        <Fragment>
          <MetaData title={'Buy Best Products Online'} />

          <h1 id="products_heading">{`${categoryHeader}`}</h1>

          <section id="products" className="container mt-5">
            <div className="row">
              <div className="col-6 col-md-3 mt-5 mb-5">
                <div className="px-5">
                  <Range
                    marks={{
                      1: `$1`,
                      1000: `$1000`,
                    }}
                    min={1}
                    max={1000}
                    defaultValue={[1, 1000]}
                    tipFormatter={(value) => `$${value}`}
                    tipProps={{
                      placement: 'top',
                      visible: true,
                    }}
                    value={price}
                    onChange={(price) => setPrice(price)}
                  />

                  <hr className="my-5" />

                  <div className="mt-5">
                    <h4 className="mb-3">Categories</h4>

                    <ul className="pl-0 card-title">
                      {categories.map((category) => (
                        <li
                          style={{
                            cursor: 'pointer',
                            listStyleType: 'none',
                          }}
                          key={category}
                          onClick={() => {
                            clickCategoryHandler(category);
                          }}
                        >
                          {category}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <hr className="my-3" />

                  <div className="mt-5">
                    <h4 className="mb-3">Ratings</h4>

                    <ul className="pl-0">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <li
                          style={{
                            cursor: 'pointer',
                            listStyleType: 'none',
                          }}
                          key={star}
                          onClick={() => setRating(star)}
                        >
                          <div className="rating-outer">
                            <div
                              className="rating-inner"
                              style={{
                                width: `${star * 20}%`,
                              }}
                            ></div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-9">
                <div className="row">
                  {products.map((product) => (
                    <Product key={product._id} product={product} col={4} />
                  ))}
                </div>
              </div>
            </div>
          </section>
          {resPerPage <= count && (
            <div className="d-flex justify-content-center mt-5">
              <Pagination
                activePage={currentPage}
                itemsCountPerPage={resPerPage}
                totalItemsCount={count}
                onChange={setCurrentPageNo}
                nextPageText={'Next'}
                prevPageText={'Prev'}
                firstPageText={'First'}
                lastPageText={'Last'}
                itemClass="page-item"
                linkClass="page-link"
              />
            </div>
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default Category;
